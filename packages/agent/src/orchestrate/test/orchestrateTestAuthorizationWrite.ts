import { IAgenticaController } from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestAuthorizeWriteFunction,
  AutoBeTestWriteEvent,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { completeTestCode } from "./compile/completeTestCode";
import { getTestArtifacts } from "./compile/getTestArtifacts";
import { transformTestAuthorizationWriteHistory } from "./histories/transformTestAuthorizationWriteHistory";
import { IAutoBeTestArtifacts } from "./structures/IAutoBeTestArtifacts";
import { IAutoBeTestAuthorizationWriteApplication } from "./structures/IAutoBeTestAuthorizationWriteApplication";
import { IAutoBeTestAuthorizeWriteResult } from "./structures/IAutoBeTestAuthorizeWriteResult";

/**
 * Test Authorization Write Orchestrator
 *
 * Creates authorization utility functions for test scenarios using LLM to
 * generate proper authentication handling code.
 */
export const orchestrateTestAuthorizationWrite = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    operations: AutoBeOpenApi.IOperation[];
  },
): Promise<IAutoBeTestAuthorizeWriteResult[]> => {
  const authOperations: AutoBeOpenApi.IOperation[] = props.operations.filter(
    (op) => op.authorizationType !== null,
  );

  // Track existing function names to prevent duplicates
  const existingFunctionNames: string[] = [];

  const progress: AutoBeProgressEventBase = {
    completed: 0,
    total: authOperations.length,
  };

  const results: Array<IAutoBeTestAuthorizeWriteResult | null> =
    await executeCachedBatch(
      ctx,
      authOperations.map((operation) => async (promptCacheKey) => {
        try {
          const artifacts: IAutoBeTestArtifacts = await getTestArtifacts(ctx, {
            endpoint: {
              method: operation.method,
              path: operation.path,
            },
          });
          const event = await process(ctx, {
            operation,
            artifacts,
            progress,
            promptCacheKey,
            existingFunctionNames,
          });
          if (event.function.type !== "authorize") return null;

          // Add successfully generated function name to the tracking array
          existingFunctionNames.push(event.function.functionName);

          ctx.dispatch(event);
          return {
            type: "authorize",
            artifacts,
            function: event.function,
            operation,
          };
        } catch (error) {
          return null;
        }
      }),
    );

  return results.filter((r) => r !== null);
};

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    operation: AutoBeOpenApi.IOperation;
    artifacts: IAutoBeTestArtifacts;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    existingFunctionNames: string[];
  },
): Promise<AutoBeTestWriteEvent> {
  const {
    operation,
    artifacts,
    progress,
    promptCacheKey,
    existingFunctionNames,
  } = props;

  const pointer: IPointer<IAutoBeTestAuthorizationWriteApplication.IProps | null> =
    {
      value: null,
    };

  const { metric, tokenUsage } = await ctx.conversate({
    source: "testWrite",
    controller: createController({
      model: ctx.model,
      existingFunctionNames,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    promptCacheKey,
    ...transformTestAuthorizationWriteHistory({
      operation,
      artifacts,
    }),
  });
  if (pointer.value === null) {
    ++progress.completed;
    throw new Error("Failed to create authorization function.");
  }

  // Complete the code with imports
  if (pointer.value.revise.final) {
    pointer.value.revise.final = await completeTestCode(
      ctx,
      artifacts,
      pointer.value.revise.final,
    );
  }
  pointer.value.draft = await completeTestCode(
    ctx,
    artifacts,
    pointer.value.draft,
  );

  // Create the authorization function object
  const authorizationFunction: AutoBeTestAuthorizeWriteFunction = {
    type: "authorize",
    endpoint: {
      method: operation.method,
      path: operation.path,
    },
    actor: pointer.value.actor,
    authType: operation.authorizationType!,
    location: `test/features/utils/authorize/${pointer.value.functionName}.ts`,
    functionName: pointer.value.functionName,
    content: pointer.value.revise.final ?? pointer.value.draft,
  };

  return {
    type: "testWrite",
    id: v7(),
    created_at: new Date().toISOString(),
    function: authorizationFunction,
    metric,
    tokenUsage,
    completed: ++progress.completed,
    total: progress.total,
    step: ctx.state().interface?.step ?? 0,
  } satisfies AutoBeTestWriteEvent;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  existingFunctionNames: string[];
  build: (next: IAutoBeTestAuthorizationWriteApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeTestAuthorizationWriteApplication.IProps> =
      typia.validate<IAutoBeTestAuthorizationWriteApplication.IProps>(input);
    if (result.success === false) return result;

    const errors: IValidation.IError[] = validateEmptyCode({
      functionName: result.data.functionName,
      draft: result.data.draft,
      revise: result.data.revise,
    });

    // Check for duplicate function names
    if (props.existingFunctionNames.includes(result.data.functionName)) {
      errors.push({
        path: "$input.functionName",
        expected: "unique function name",
        value: result.data.functionName,
        description: `Function name '${result.data.functionName}' already exists. Please analyze the resource more accurately and use a more specific name. Existing function names: [${props.existingFunctionNames.join(", ")}]`,
      });
    }

    return errors.length
      ? {
          success: false,
          errors,
          data: result.data,
        }
      : result;
  };

  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt"
      ? "chatgpt"
      : props.model === "gemini"
        ? "gemini"
        : "claude"
  ](
    validate,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;

  return {
    protocol: "class",
    name: "TestAuthorizationWrite",
    application,
    execute: {
      write: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeTestAuthorizationWriteApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeTestAuthorizationWriteApplication, "chatgpt">({
      validate: {
        write: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeTestAuthorizationWriteApplication, "claude">({
      validate: {
        write: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeTestAuthorizationWriteApplication, "gemini">({
      validate: {
        write: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestAuthorizationWriteApplication.IProps>;
