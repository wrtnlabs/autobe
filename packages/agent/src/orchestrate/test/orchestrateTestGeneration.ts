import { IAgenticaController } from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestWriteEvent,
  AutoBeTestWriteGenerationFunction,
  AutoBeTestWritePrepareFunction,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { getTestScenarioArtifacts } from "./compile/getTestScenarioArtifacts";
import { transformTestWriteGenerationHistory } from "./histories/transformTestWriteGenerationHistory";
import { IAutoBeTestScenarioArtifacts } from "./structures/IAutoBeTestScenarioArtifacts";
import { IAutoBeTestWriteGenerationApplication } from "./structures/IAutoBeTestWriteGenerationApplication";

interface IAutoBeTestWriteGenerationResult {
  prepareFunction: AutoBeTestWritePrepareFunction;
  operation: AutoBeOpenApi.IOperation;
  event: AutoBeTestWriteGenerationFunction;
}

export const orchestrateTestGeneration = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    preparedFunctions: AutoBeTestWritePrepareFunction[];
  },
): Promise<AutoBeTestWriteGenerationFunction[]> => {
  const progress: AutoBeProgressEventBase = {
    total: props.preparedFunctions.length,
    completed: 0,
  };

  const result: Array<IAutoBeTestWriteGenerationResult | null> =
    await executeCachedBatch(
      ctx,
      props.preparedFunctions.map(
        (prepareFunction) => async (promptCacheKey) => {
          try {
            // Find matching operation by endpoint
            const operation = props.document.operations.find(
              (op) =>
                op.method === prepareFunction.endpoint.method &&
                op.path === prepareFunction.endpoint.path,
            );
            if (!operation) return null;

            const event: AutoBeTestWriteEvent = await process(ctx, {
              prepareFunction,
              operation,
              progress,
              promptCacheKey,
              instruction: props.instruction,
            });
            ctx.dispatch(event);

            if (event.function.kind !== "generation")
              throw new Error(
                `Unexpected testWrite function kind: ${event.function.kind}`,
              );

            return {
              prepareFunction,
              operation,
              event: event.function,
            } satisfies IAutoBeTestWriteGenerationResult;
          } catch {
            return null;
          }
        },
      ),
    );

  return result
    .filter((r): r is IAutoBeTestWriteGenerationResult => r !== null)
    .map((r) => r.event);
};

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    prepareFunction: AutoBeTestWritePrepareFunction;
    operation: AutoBeOpenApi.IOperation;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<AutoBeTestWriteEvent> {
  const { prepareFunction, operation, progress, promptCacheKey } = props;

  // Get artifacts for this specific operation
  const artifacts: IAutoBeTestScenarioArtifacts =
    await getTestScenarioArtifacts(ctx, {
      endpoint: prepareFunction.endpoint,
      dependencies: [],
      functionName: prepareFunction.functionName,
    });

  const pointer: IPointer<IAutoBeTestWriteGenerationApplication.IProps | null> =
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
    ...transformTestWriteGenerationHistory(
      props.instruction,
      prepareFunction,
      operation,
      artifacts,
    ),
  });

  if (pointer.value === null)
    throw new Error("Failed to create generation function.");

  return {
    type: "testWrite",
    id: v7(),
    created_at: new Date().toISOString(),
    function: {
      kind: "generation",
      endpoint: prepareFunction.endpoint,
      actor: operation.authorizationActor,
      location: `test/features/utils/generation/${pointer.value.functionName}.ts`,
      functionName: pointer.value.functionName,
      content: pointer.value.revise.final ?? pointer.value.draft,
    },
    metric,
    tokenUsage,
    completed: ++progress.completed,
    total: progress.total,
    step: ctx.state().test?.step ?? 0,
  } satisfies AutoBeTestWriteEvent;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeTestWriteGenerationApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeTestWriteGenerationApplication.IProps> =
      typia.validate<IAutoBeTestWriteGenerationApplication.IProps>(input);
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
    name: "testWriteGeneration",
    application,
    execute: {
      generate: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeTestWriteGenerationApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeTestWriteGenerationApplication, "chatgpt">({
      validate: {
        generate: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeTestWriteGenerationApplication, "claude">({
      validate: {
        generate: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeTestWriteGenerationApplication, "gemini">({
      validate: {
        generate: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestWriteGenerationApplication.IProps>;
