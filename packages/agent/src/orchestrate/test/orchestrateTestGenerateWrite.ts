import { IAgenticaController } from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestPrepareFunction,
  AutoBeTestWriteEvent,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";
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
import { transformTestGenerationWriteHistory } from "./histories/transformTestGenerationWriteHistory";
import { IAutoBeTestArtifacts } from "./structures/IAutoBeTestArtifacts";
import { IAutoBeTestGenerateProcedure } from "./structures/IAutoBeTestGenerateProcedure";
import { IAutoBeTestGenerationWriteApplication } from "./structures/IAutoBeTestGenerationWriteApplication";
import { getTestImportFromFunction } from "./utils/getTestImportFromFunction";

export const orchestrateTestGenerateWrite = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    prepares: AutoBeTestPrepareFunction[];
  },
): Promise<IAutoBeTestGenerateProcedure[]> => {
  // Track existing function names to prevent duplicates
  const existingFunctionNames: string[] = [];

  const progress: AutoBeProgressEventBase = {
    total: props.prepares.length,
    completed: 0,
  };

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
            prepareFunction,
            artifacts,
            operation,
            progress,
            promptCacheKey,
            instruction: props.instruction,
            existingFunctionNames,
          });
          if (event.function.type !== "generate") return null;

          // Add successfully generated function name to the tracking array
          existingFunctionNames.push(event.function.name);

          ctx.dispatch(event);
          return {
            type: "generate",
            prepareFunction,
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

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    prepareFunction: AutoBeTestPrepareFunction;
    artifacts: IAutoBeTestArtifacts;
    operation: AutoBeOpenApi.IOperation;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
    existingFunctionNames: string[];
  },
): Promise<AutoBeTestWriteEvent> {
  const {
    prepareFunction,
    artifacts,
    operation,
    progress,
    promptCacheKey,
    existingFunctionNames,
  } = props;

  const pointer: IPointer<IAutoBeTestGenerationWriteApplication.IProps | null> =
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
    ...transformTestGenerationWriteHistory(
      props.instruction,
      prepareFunction,
      operation,
      artifacts,
    ),
  });

  if (pointer.value === null) {
    ++progress.completed;
    throw new Error("Failed to create generation function.");
  }

  // Generate prepare function import statement
  const importStatement: string = getTestImportFromFunction({
    target: {
      type: "generate",
      operation,
      prepareFunction,
      artifacts,
      function: {
        type: "generate",
        endpoint: {
          method: operation.method,
          path: operation.path,
        },
        actor: operation.authorizationActor,
        location: `test/features/utils/generation/${pointer.value.functionName}.ts`,
        name: pointer.value.functionName,
        content: pointer.value.revise.final ?? pointer.value.draft,
      },
    },
  });

  if (pointer.value.revise.final)
    pointer.value.revise.final = await completeTestCode(
      ctx,
      artifacts,
      pointer.value.revise.final,
      importStatement,
    );
  pointer.value.draft = await completeTestCode(
    ctx,
    artifacts,
    pointer.value.draft,
    importStatement,
  );

  return {
    type: "testWrite",
    id: v7(),
    created_at: new Date().toISOString(),
    function: {
      type: "generate",
      endpoint: {
        method: operation.method,
        path: operation.path,
      },
      actor: operation.authorizationActor,
      location: `test/features/utils/generation/${pointer.value.functionName}.ts`,
      name: pointer.value.functionName,
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
  existingFunctionNames: string[];
  build: (next: IAutoBeTestGenerationWriteApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeTestGenerationWriteApplication.IProps> =
      typia.validate<IAutoBeTestGenerationWriteApplication.IProps>(input);
    if (result.success === false) return result;

    const errors: IValidation.IError[] = validateEmptyCode({
      functionName: result.data.functionName,
      draft: result.data.draft,
      revise: result.data.revise,
      path: "$input",
    });

    if (result.data.functionName.startsWith("generate_") === false) {
      errors.push({
        path: "$input.functionName",
        expected: "string (starting with 'generate_')",
        value: result.data.functionName,
        description:
          "The function name must have format of 'generate_random_{resource}'.",
      });
    }

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
    name: "testGenerationWrite",
    application,
    execute: {
      generate: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeTestGenerationWriteApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeTestGenerationWriteApplication, "chatgpt">({
      validate: {
        generate: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeTestGenerationWriteApplication, "claude">({
      validate: {
        generate: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeTestGenerationWriteApplication, "gemini">({
      validate: {
        generate: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestGenerationWriteApplication.IProps>;
