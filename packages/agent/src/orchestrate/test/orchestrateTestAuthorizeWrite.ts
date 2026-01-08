import { IAgenticaController } from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestAuthorizeFunction,
  AutoBeTestWriteEvent,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { getTestArtifacts } from "./compile/getTestArtifacts";
import { transformTestAuthorizeWriteHistory } from "./histories/transformTestAuthorizeWriteHistory";
import { AutoBeTestAuthorizeProgrammer } from "./programmers/AutoBeTestAuthorizeProgrammer";
import { IAutoBeTestArtifacts } from "./structures/IAutoBeTestArtifacts";
import { IAutoBeTestAuthorizationWriteApplication } from "./structures/IAutoBeTestAuthorizationWriteApplication";
import { IAutoBeTestAuthorizeProcedure } from "./structures/IAutoBeTestAuthorizeWriteResult";

/**
 * Test Authorization Write Orchestrator
 *
 * Creates authorization utility functions for test scenarios using LLM to
 * generate proper authentication handling code.
 */
export const orchestrateTestAuthorizeWrite = async (
  ctx: AutoBeContext,
  props: {
    instruction: string;
    progress: AutoBeProgressEventBase;
    document: AutoBeOpenApi.IDocument;
  },
): Promise<IAutoBeTestAuthorizeProcedure[]> => {
  const authOperations: AutoBeOpenApi.IOperation[] =
    props.document.operations.filter(
      (op) =>
        op.authorizationType !== null &&
        op.requestBody !== null &&
        op.responseBody !== null,
    );
  return await executeCachedBatch(
    ctx,
    authOperations.map((operation) => async (promptCacheKey) => {
      const artifacts: IAutoBeTestArtifacts = await getTestArtifacts(ctx, {
        endpoint: {
          method: operation.method,
          path: operation.path,
        },
      });
      const event: AutoBeTestWriteEvent<AutoBeTestAuthorizeFunction> =
        await process(ctx, {
          operation,
          artifacts,
          progress: props.progress,
          promptCacheKey,
        });
      ctx.dispatch(event);
      return {
        type: "authorize",
        artifacts,
        function: event.function,
        operation,
      };
    }),
  );
};

async function process(
  ctx: AutoBeContext,
  props: {
    operation: AutoBeOpenApi.IOperation;
    artifacts: IAutoBeTestArtifacts;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeTestWriteEvent<AutoBeTestAuthorizeFunction>> {
  const pointer: IPointer<IAutoBeTestAuthorizationWriteApplication.IProps | null> =
    {
      value: null,
    };

  const { metric, tokenUsage } = await ctx.conversate({
    source: "testWrite",
    controller: createController({
      operation: props.operation,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    promptCacheKey: props.promptCacheKey,
    ...(await transformTestAuthorizeWriteHistory(ctx, {
      operation: props.operation,
      artifacts: props.artifacts,
    })),
  });
  if (pointer.value === null) {
    ++props.progress.completed;
    throw new Error("Failed to create authorization function.");
  }

  // Create the authorize function
  const functionName: string = AutoBeTestAuthorizeProgrammer.getFunctionName({
    actor: pointer.value.actor,
    operation: props.operation,
  });
  const authorizationFunction: AutoBeTestAuthorizeFunction = {
    type: "authorize",
    endpoint: {
      method: props.operation.method,
      path: props.operation.path,
    },
    actor: pointer.value.actor,
    authType: props.operation.authorizationType!,
    location: `test/authorize/${functionName}.ts`,
    name: functionName,
    content: await AutoBeTestAuthorizeProgrammer.replaceImportStatements({
      compiler: await ctx.compiler(),
      artifacts: props.artifacts,
      content: pointer.value.revise.final ?? pointer.value.draft,
    }),
  };
  return {
    type: "testWrite",
    id: v7(),
    created_at: new Date().toISOString(),
    function: authorizationFunction,
    metric,
    tokenUsage,
    completed: ++props.progress.completed,
    total: props.progress.total,
    step: ctx.state().interface?.step ?? 0,
  } satisfies AutoBeTestWriteEvent<AutoBeTestAuthorizeFunction>;
}

function createController(props: {
  operation: AutoBeOpenApi.IOperation;
  build: (next: IAutoBeTestAuthorizationWriteApplication.IProps) => void;
}): IAgenticaController.IClass {
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeTestAuthorizationWriteApplication.IProps> =
      typia.validate<IAutoBeTestAuthorizationWriteApplication.IProps>(input);
    if (result.success === false) return result;

    const functionName: string = AutoBeTestAuthorizeProgrammer.getFunctionName({
      actor: result.data.actor,
      operation: props.operation,
    });
    const errors: IValidation.IError[] = validateEmptyCode({
      functionName,
      draft: result.data.draft,
      revise: result.data.revise,
      path: "$input",
    });
    return errors.length
      ? {
          success: false,
          errors,
          data: result.data,
        }
      : result;
  };

  const application: ILlmApplication =
    typia.llm.application<IAutoBeTestAuthorizationWriteApplication>({
      validate: {
        write: validate,
      },
    });

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

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestAuthorizationWriteApplication.IProps>;
