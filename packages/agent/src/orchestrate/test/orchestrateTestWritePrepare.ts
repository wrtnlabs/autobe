import { IAgenticaController } from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestWriteEvent,
  AutoBeTestWritePrepareFunction,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { HashMap, IPointer, Pair } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { transformTestWritePrepareHistories } from "./histories/transformTestWritePrepareHistories";
import { IAutoBeTestWritePrepareApplication } from "./structures/IAutoBeTestWritePrepareApplication";

/**
 * Orchestrates the generation of test data preparation functions.
 *
 * This orchestrator analyzes all ICreate DTOs from OpenAPI operations and
 * generates intelligent test data preparation functions that:
 *
 * - Create mock data respecting validation constraints
 * - Exclude sensitive/system-managed properties from input parameters
 * - Generate realistic test data using @nestia/e2e utilities
 * - Support partial input overrides for test customization
 *
 * The prepare functions enable consistent, maintainable test data generation
 * across the entire E2E test suite.
 *
 * @param ctx AutoBE context containing OpenAPI document and LLM access
 * @param instruction User instructions for test data generation context
 * @returns Array of generated prepare function definitions
 */
export const orchestrateTestWritePrepare = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  instruction: string,
): Promise<AutoBeTestWritePrepareFunction[]> => {
  // Extract OpenAPI document from interface phase
  const document: AutoBeOpenApi.IDocument | undefined =
    ctx.state().interface?.document;
  if (document === undefined) {
    throw new Error(
      "Unreachable: Cannot prepare test utilities without interface document.",
    );
  }

  const createOperations: AutoBeOpenApi.IOperation[] =
    document.operations.filter(
      (op) =>
        op.method === "post" &&
        op.requestBody !== null &&
        (op.requestBody.typeName.includes(".ICreate") ||
          op.requestBody.typeName.endsWith("ICreate")),
    );

  const progress: AutoBeProgressEventBase = {
    total: 0,
    completed: 0,
  };

  // Filter operations with ICreate DTOs and map with schemas
  const dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IJsonSchema> =
    new HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IJsonSchema>(
      createOperations.map(
        (op) =>
          new Pair(
            { method: op.method, path: op.path },
            document.components.schemas[op.requestBody?.typeName ?? ""] ?? {},
          ),
      ),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );

  progress.total = dict.size();

  // Generate prepare functions using LLM in parallel with prompt caching
  const prepareFunctions: Array<AutoBeTestWritePrepareFunction | null> =
    await executeCachedBatch(
      ctx,
      createOperations.map((op) => async (promptCacheKey) => {
        try {
          const endpoint: AutoBeOpenApi.IEndpoint = {
            method: op.method,
            path: op.path,
          };
          const schema: AutoBeOpenApi.IJsonSchema = dict.get(endpoint);
          const typeName: string | undefined = op.requestBody?.typeName;
          if (typeName === undefined) return null;

          const result = await process(ctx, {
            operation: op,
            typeName,
            schema,
            promptCacheKey,
            progress,
            instruction,
          });
          if (result.function.kind !== "prepare") return null;

          return result.function;
        } catch {
          ++progress.completed;
          return null;
        }
      }),
    );

  // Filter out null results and return successful generations
  return prepareFunctions.filter((f) => f !== null);
};

/** Processes the generation of a single prepare function using LLM. */
async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    operation: AutoBeOpenApi.IOperation;
    schema: AutoBeOpenApi.IJsonSchema;
    typeName: string;
    promptCacheKey: string;
    progress: AutoBeProgressEventBase;
    instruction: string;
  },
): Promise<AutoBeTestWriteEvent> {
  const { operation, schema, promptCacheKey, progress, instruction } = props;

  // Validate schema is an object schema
  if (!("properties" in schema)) {
    throw new Error(
      `Failed to generate prepare function for ${props.typeName}`,
    );
  }

  const pointer: IPointer<IAutoBeTestWritePrepareApplication.IProps | null> = {
    value: null,
  };
  // Execute LLM conversation with function calling
  const { metric, tokenUsage } = await ctx.conversate({
    source: "testWrite",
    controller: createController({
      model: ctx.model,
      dtoTypeName: props.operation.requestBody?.typeName ?? "",
      build: (app) => {
        pointer.value = app;
      },
    }),
    enforceFunctionCall: true,
    promptCacheKey,
    ...transformTestWritePrepareHistories({
      operation,
      schema,
      instruction,
    }),
  });
  // Validate LLM response
  if (pointer.value === null) {
    throw new Error(
      `Failed to generate prepare function for ${props.typeName}`,
    );
  }

  const event: AutoBeTestWriteEvent = {
    id: v7(),
    type: "testWrite",
    function: {
      kind: "prepare",
      endpoint: props.operation,
      dtoTypeName: props.typeName,
      location: `test/features/utils/prepare/${pointer.value.functionName}.ts`,
      functionName: pointer.value.functionName,
      content: pointer.value.revise.final ?? pointer.value.draft,
    },
    completed: ++progress.completed,
    total: progress.total,
    step: ctx.state().interface?.step ?? 0,
    tokenUsage,
    metric,
    created_at: new Date().toISOString(),
  };
  ctx.dispatch(event);
  return event;
}

/** Creates LLM controller for function calling. */
function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  dtoTypeName: string;
  build: (app: IAutoBeTestWritePrepareApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    // Basic typia validation
    const result: IValidation<IAutoBeTestWritePrepareApplication.IProps> =
      typia.validate<IAutoBeTestWritePrepareApplication.IProps>(input);
    if (result.success === false) return result;

    // Custom business logic validation
    const errors: IValidation.IError[] = validateEmptyCode({
      functionName: result.data.functionName,
      draft: result.data.draft,
      revise: result.data.revise,
    });

    return errors.length > 0
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
    name: "testWritePrepare",
    application,
    execute: {
      write: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeTestWritePrepareApplication,
  };
}

/** LLM application collection for different models. */
const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeTestWritePrepareApplication, "chatgpt">({
      validate: {
        write: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeTestWritePrepareApplication, "claude">({
      validate: {
        write: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeTestWritePrepareApplication, "gemini">({
      validate: {
        write: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestWritePrepareApplication.IProps>;
