import { IAgenticaController } from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestWriteEvent,
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
import { completeTestCode } from "./compile/completeTestCode";
import { getTestArtifacts } from "./compile/getTestArtifacts";
import { transformTestPrepareWriteHistories } from "./histories/transformTestPrepareWriteHistories";
import { IAutoBeTestArtifacts } from "./structures/IAutoBeTestArtifacts";
import { IAutoBeTestPrepareWriteApplication } from "./structures/IAutoBeTestPrepareWriteApplication";
import { IAutoBeTestPrepareWriteResult } from "./structures/IAutoBeTestPrepareWriteResult";

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
export const orchestrateTestPrepareWrite = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: { instruction: string; document: AutoBeOpenApi.IDocument },
): Promise<IAutoBeTestPrepareWriteResult[]> => {
  const { instruction, document } = props;
  const createOperations: AutoBeOpenApi.IOperation[] =
    document.operations.filter(
      (op) =>
        op.method === "post" &&
        op.requestBody !== null &&
        (op.requestBody.typeName.includes(".ICreate") ||
          op.requestBody.typeName.endsWith("ICreate")),
    );

  // Track existing function names to prevent duplicates
  const existingFunctionNames: string[] = [];

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
  const result: Array<IAutoBeTestPrepareWriteResult | null> =
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

          const artifacts: IAutoBeTestArtifacts = await getTestArtifacts(ctx, {
            endpoint,
          });

          const event = await process(ctx, {
            operation: op,
            artifacts,
            typeName,
            schema,
            promptCacheKey,
            progress,
            instruction,
            existingFunctionNames,
          });
          if (event.function.type !== "prepare") return null;

          // Add successfully generated function name to the tracking array
          existingFunctionNames.push(event.function.functionName);

          ctx.dispatch(event);
          return {
            type: "prepare",
            artifacts,
            function: event.function,
            operation: op,
          };
        } catch {
          return null;
        }
      }),
    );

  // Filter out null results and return successful generations
  return result.filter((r) => r !== null);
};

/** Processes the generation of a single prepare function using LLM. */
async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    operation: AutoBeOpenApi.IOperation;
    artifacts: IAutoBeTestArtifacts;
    schema: AutoBeOpenApi.IJsonSchema;
    typeName: string;
    promptCacheKey: string;
    progress: AutoBeProgressEventBase;
    instruction: string;
    existingFunctionNames: string[];
  },
): Promise<AutoBeTestWriteEvent> {
  const {
    operation,
    artifacts,
    schema,
    promptCacheKey,
    progress,
    instruction,
    existingFunctionNames,
  } = props;

  // Validate schema is an object schema
  if (!("properties" in schema)) {
    throw new Error(
      `Failed to generate prepare function for ${props.typeName}`,
    );
  }

  const pointer: IPointer<IAutoBeTestPrepareWriteApplication.IProps | null> = {
    value: null,
  };
  // Execute LLM conversation with function calling
  const { metric, tokenUsage } = await ctx.conversate({
    source: "testWrite",
    controller: createController({
      model: ctx.model,
      dtoTypeName: props.operation.requestBody?.typeName ?? "",
      existingFunctionNames,
      build: (app) => {
        pointer.value = app;
      },
    }),
    enforceFunctionCall: true,
    promptCacheKey,
    ...transformTestPrepareWriteHistories({
      operation,
      schema,
      instruction,
    }),
  });
  // Validate LLM response
  if (pointer.value === null) {
    ++progress.completed;
    throw new Error(
      `Failed to generate prepare function for ${props.typeName}`,
    );
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

  const event: AutoBeTestWriteEvent = {
    id: v7(),
    type: "testWrite",
    function: {
      type: "prepare",
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
  return event;
}

/** Creates LLM controller for function calling. */
function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  dtoTypeName: string;
  existingFunctionNames: string[];
  build: (app: IAutoBeTestPrepareWriteApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    // Basic typia validation
    const result: IValidation<IAutoBeTestPrepareWriteApplication.IProps> =
      typia.validate<IAutoBeTestPrepareWriteApplication.IProps>(input);
    if (result.success === false) return result;

    // Custom business logic validation
    const errors: IValidation.IError[] = validateEmptyCode({
      functionName: result.data.functionName,
      draft: result.data.draft,
      revise: result.data.revise,
    });

    if (result.data.functionName.startsWith("prepare_") === false) {
      errors.push({
        path: "$input.functionName",
        expected: "string (starting with 'prepare_')",
        value: result.data.functionName,
        description:
          "The function name must have format of 'prepare_random_{resource}'.",
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

    // Incorrect template literal syntax validation
    const backtickRegex: RegExp = /`/g;
    const count: number = (
      (result.data.revise.final ?? result.data.draft).match(backtickRegex) ?? []
    ).length;

    if (count % 2 !== 0)
      errors.push({
        path: result.data.revise.final
          ? "$input.request.revise.final"
          : "$input.request.draft",
        expected: "even number of backticks",
        value: count,
        description: "Unmatched backtick in template literal",
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
    name: "testPrepareWrite",
    application,
    execute: {
      write: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeTestPrepareWriteApplication,
  };
}

/** LLM application collection for different models. */
const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeTestPrepareWriteApplication, "chatgpt">({
      validate: {
        write: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeTestPrepareWriteApplication, "claude">({
      validate: {
        write: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeTestPrepareWriteApplication, "gemini">({
      validate: {
        write: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestPrepareWriteApplication.IProps>;
