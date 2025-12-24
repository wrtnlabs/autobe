import { IAgenticaController } from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestPrepareFunction,
  AutoBeTestWriteEvent,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { getTestArtifacts } from "./compile/getTestArtifacts";
import { transformTestGenerateWriteHistory } from "./histories/transformTestGenerationWriteHistory";
import { AutoBeTestGenerateProgrammer } from "./programmers/AutoBeTestGenerateProgrammer";
import { IAutoBeTestArtifacts } from "./structures/IAutoBeTestArtifacts";
import { IAutoBeTestGenerateProcedure } from "./structures/IAutoBeTestGenerateProcedure";
import { IAutoBeTestGenerationWriteApplication } from "./structures/IAutoBeTestGenerationWriteApplication";

export const orchestrateTestGenerateWrite = async (
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    prepares: AutoBeTestPrepareFunction[];
    progress: AutoBeProgressEventBase;
  },
): Promise<IAutoBeTestGenerateProcedure[]> => {
  const result: Array<IAutoBeTestGenerateProcedure | null> =
    await executeCachedBatch(
      ctx,
      props.document.operations.map((operation) => async (promptCacheKey) => {
        if (operation.requestBody === null) return null;
        else if (operation.requestBody.typeName.endsWith(".ICreate") === false)
          return null;
        else if (
          props.document.components.schemas[operation.requestBody.typeName] ===
          undefined
        )
          return null;
        else if (
          AutoBeOpenApiTypeChecker.isObject(
            props.document.components.schemas[operation.requestBody.typeName],
          ) === false
        )
          return null;

        const prepareFunction: AutoBeTestPrepareFunction | undefined =
          props.prepares.find(
            (pf) => pf.typeName === operation.requestBody?.typeName,
          );
        if (prepareFunction === undefined) return null;

        try {
          const artifacts: IAutoBeTestArtifacts = await getTestArtifacts(ctx, {
            endpoint: {
              path: operation.path,
              method: operation.method,
            },
          });
          const event: AutoBeTestWriteEvent = await process(ctx, {
            prepare: prepareFunction,
            artifacts,
            operation,
            progress: props.progress,
            promptCacheKey,
            instruction: props.instruction,
          });
          if (event.function.type !== "generate") return null;

          ctx.dispatch(event);
          return {
            type: "generate",
            prepare: prepareFunction,
            artifacts,
            function: event.function,
            operation,
          } satisfies IAutoBeTestGenerateProcedure;
        } catch {
          return null;
        }
      }),
    );

  return result.filter((r) => r !== null);
};

async function process(
  ctx: AutoBeContext,
  props: {
    prepare: AutoBeTestPrepareFunction;
    artifacts: IAutoBeTestArtifacts;
    operation: AutoBeOpenApi.IOperation;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<AutoBeTestWriteEvent> {
  const functionName: string = AutoBeTestGenerateProgrammer.getFunctionName(
    props.operation,
  );
  const pointer: IPointer<IAutoBeTestGenerationWriteApplication.IProps | null> =
    {
      value: null,
    };
  const { metric, tokenUsage } = await ctx.conversate({
    source: "testWrite",
    controller: createController({
      functionName,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    promptCacheKey: props.promptCacheKey,
    ...(await transformTestGenerateWriteHistory(ctx, {
      instruction: props.instruction,
      prepare: props.prepare,
      operation: props.operation,
      artifacts: props.artifacts,
    })),
  });

  if (pointer.value === null) {
    ++props.progress.completed;
    throw new Error("Failed to create generation function.");
  }

  const location: string = `test/features/utils/generation/${functionName}.ts`;
  return {
    type: "testWrite",
    id: v7(),
    created_at: new Date().toISOString(),
    function: {
      type: "generate",
      endpoint: {
        method: props.operation.method,
        path: props.operation.path,
      },
      actor: props.operation.authorizationActor,
      location,
      name: functionName,
      content: await AutoBeTestGenerateProgrammer.replaceImportStatements({
        compiler: await ctx.compiler(),
        artifacts: props.artifacts,
        prepare: props.prepare,
        location,
        content: pointer.value.revise.final ?? pointer.value.draft,
      }),
    },
    metric,
    tokenUsage,
    completed: ++props.progress.completed,
    total: props.progress.total,
    step: ctx.state().test?.step ?? 0,
  } satisfies AutoBeTestWriteEvent;
}

function createController(props: {
  functionName: string;
  build: (next: IAutoBeTestGenerationWriteApplication.IProps) => void;
}): IAgenticaController.IClass {

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeTestGenerationWriteApplication.IProps> =
      typia.validate<IAutoBeTestGenerationWriteApplication.IProps>(input);
    if (result.success === false) return result;

    const errors: IValidation.IError[] = validateEmptyCode({
      functionName: props.functionName,
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

  const application: ILlmApplication = typia.llm.application<IAutoBeTestGenerationWriteApplication>({
    validate: {
      generate: validate,
    },
  });

  return {
    protocol: "class",
    name: "testGenerationWrite",
    application,
    execute: {
      generate: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeTestGenerationWriteApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestGenerationWriteApplication.IProps>;
