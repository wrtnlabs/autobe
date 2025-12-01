import { IAgenticaController } from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestWriteAuthorizationFunction,
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
import { transformTestWriteAuthorizationHistories } from "./histories/transformTestWriteAuthorizationHistories";
import { IAutoBeTestArtifacts } from "./structures/IAutoBeTestArtifacts";
import { IAutoBeTestWriteAuthorizationApplication } from "./structures/IAutoBeTestWriteAuthorizationApplication";

/**
 * Test Write Authorization Orchestrator
 *
 * Creates authorization utility functions for test scenarios using LLM to
 * generate proper authentication handling code.
 */
export const orchestrateTestWriteAuthorization = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    operations: AutoBeOpenApi.IOperation[];
  },
): Promise<AutoBeTestWriteAuthorizationFunction[]> => {
  const authOperations: AutoBeOpenApi.IOperation[] = props.operations.filter(
    (op) => op.authorizationType !== null,
  );

  const progress: AutoBeProgressEventBase = {
    completed: 0,
    total: authOperations.length,
  };

  const results = await executeCachedBatch(
    ctx,
    authOperations.map((operation) => async (promptCacheKey) => {
      try {
        const event = await process(ctx, {
          operation,
          progress,
          promptCacheKey,
        });

        ctx.dispatch(event);
        return event;
      } catch (error) {
        console.error(error);
        return null;
      }
    }),
  );

  const authorizationFunctions: AutoBeTestWriteAuthorizationFunction[] = results
    .filter((event): event is AutoBeTestWriteEvent => event !== null)
    .map((event) => {
      if (event.function.kind !== "authorization") {
        throw new Error("Unexpected function kind in authorization event");
      }
      return event.function;
    });

  return authorizationFunctions;
};

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    operation: AutoBeOpenApi.IOperation;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeTestWriteEvent> {
  const { operation, progress, promptCacheKey } = props;
  // Get artifacts for this specific operation
  const artifacts: IAutoBeTestArtifacts = await getTestArtifacts(ctx, {
    endpoint: {
      method: operation.method,
      path: operation.path,
    },
  });

  const pointer: IPointer<IAutoBeTestWriteAuthorizationApplication.IProps | null> =
    {
      value: null,
    };

  const { metric, tokenUsage } = await ctx.conversate({
    source: "testWrite",
    controller: createController({
      model: ctx.model,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    promptCacheKey,
    ...transformTestWriteAuthorizationHistories({
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
  const authorizationFunction: AutoBeTestWriteAuthorizationFunction = {
    kind: "authorization",
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
  build: (next: IAutoBeTestWriteAuthorizationApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeTestWriteAuthorizationApplication.IProps> =
      typia.validate<IAutoBeTestWriteAuthorizationApplication.IProps>(input);
    if (result.success === false) return result;

    const errors: IValidation.IError[] = validateEmptyCode({
      functionName: result.data.functionName,
      draft: result.data.draft,
      revise: result.data.revise,
    });

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
    name: "TestWriteAuthorization",
    application,
    execute: {
      write: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeTestWriteAuthorizationApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeTestWriteAuthorizationApplication, "chatgpt">({
      validate: {
        write: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeTestWriteAuthorizationApplication, "claude">({
      validate: {
        write: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeTestWriteAuthorizationApplication, "gemini">({
      validate: {
        write: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestWriteAuthorizationApplication.IProps>;
