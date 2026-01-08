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
import { transformTestPrepareWriteHistory } from "./histories/transformTestPrepareWriteHistory";
import { AutoBeTestPrepareProgrammer } from "./programmers/AutoBeTestPrepareProgrammer";
import { IAutoBeTestPrepareProcedure } from "./structures/IAutoBeTestPrepareProcedure";
import { IAutoBeTestPrepareWriteApplication } from "./structures/IAutoBeTestPrepareWriteApplication";

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
export const orchestrateTestPrepareWrite = async (
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    progress: AutoBeProgressEventBase;
  },
): Promise<IAutoBeTestPrepareProcedure[]> => {
  interface ICreateType {
    key: string;
    value: AutoBeOpenApi.IJsonSchema.IObject;
  }
  const createTypes: ICreateType[] = [];
  for (const [key, value] of Object.entries(props.document.components.schemas))
    if (
      key.endsWith(".ICreate") &&
      AutoBeOpenApiTypeChecker.isObject(value) === true
    )
      createTypes.push({
        key,
        value,
      });

  // Generate prepare functions using LLM in parallel with prompt caching
  const result: Array<IAutoBeTestPrepareProcedure | null> =
    await executeCachedBatch(
      ctx,
      createTypes.map((entry) => async (promptCacheKey) => {
        try {
          const event: AutoBeTestWriteEvent<AutoBeTestPrepareFunction> =
            await process(ctx, {
              document: props.document,
              typeName: entry.key,
              schema: entry.value,
              instruction: props.instruction,
              promptCacheKey,
              progress: props.progress,
            });
          ctx.dispatch(event);
          return {
            type: "prepare",
            typeName: entry.key,
            schema: entry.value,
            function: event.function,
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
async function process(
  ctx: AutoBeContext,
  props: {
    document: AutoBeOpenApi.IDocument;
    typeName: string;
    schema: AutoBeOpenApi.IJsonSchema.IObject;
    promptCacheKey: string;
    progress: AutoBeProgressEventBase;
    instruction: string;
  },
): Promise<AutoBeTestWriteEvent<AutoBeTestPrepareFunction>> {
  const pointer: IPointer<IAutoBeTestPrepareWriteApplication.IProps | null> = {
    value: null,
  };
  // Execute LLM conversation with function calling
  const { metric, tokenUsage } = await ctx.conversate({
    source: "testWrite",
    controller: createController({
      dtoTypeName: props.typeName,
      schema: props.schema,
      build: (app) => {
        pointer.value = app;
      },
    }),
    enforceFunctionCall: true,
    promptCacheKey: props.promptCacheKey,
    ...(await transformTestPrepareWriteHistory(ctx, props)),
  });
  // Validate LLM response
  if (pointer.value === null) {
    ++props.progress.completed;
    throw new Error(
      `Failed to generate prepare function for ${props.typeName}`,
    );
  }

  const functionName: string = AutoBeTestPrepareProgrammer.getFunctionName(
    props.typeName,
  );
  const event: AutoBeTestWriteEvent<AutoBeTestPrepareFunction> = {
    id: v7(),
    type: "testWrite",
    function: {
      type: "prepare",
      location: `test/prepare/${functionName}.ts`,
      content: await AutoBeTestPrepareProgrammer.replaceImportStatements({
        compiler: await ctx.compiler(),
        typeName: props.typeName,
        schemas: props.document.components.schemas,
        content: pointer.value.revise.final ?? pointer.value.draft,
      }),
      typeName: props.typeName,
      name: functionName,
    },
    completed: ++props.progress.completed,
    total: props.progress.total,
    step: ctx.state().interface?.step ?? 0,
    tokenUsage,
    metric,
    created_at: new Date().toISOString(),
  };
  return event;
}

/** Creates LLM controller for function calling. */
function createController(props: {
  dtoTypeName: string;
  schema: AutoBeOpenApi.IJsonSchema.IObject;
  build: (app: IAutoBeTestPrepareWriteApplication.IProps) => void;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeTestPrepareWriteApplication.IProps> => {
    // Basic typia validation
    const result: IValidation<IAutoBeTestPrepareWriteApplication.IProps> =
      typia.validate<IAutoBeTestPrepareWriteApplication.IProps>(input);
    if (result.success === false) return result;

    // Custom business logic validation
    const errors: IValidation.IError[] = AutoBeTestPrepareProgrammer.validate({
      typeName: props.dtoTypeName,
      schema: props.schema,
      mappings: result.data.mappings,
      draft: result.data.draft,
      revise: result.data.revise,
    });

    // // Incorrect template literal syntax validation
    // const backtickRegex: RegExp = /`/g;
    // const count: number = (
    //   (result.data.revise.final ?? result.data.draft).match(backtickRegex) ?? []
    // ).length;

    // if (count % 2 !== 0)
    //   errors.push({
    //     path: result.data.revise.final
    //       ? "$input.request.revise.final"
    //       : "$input.request.draft",
    //     expected: "even number of backticks",
    //     value: count,
    //     description: "Unmatched backtick in template literal",
    //   });

    return errors.length > 0
      ? {
          success: false,
          errors,
          data: result.data,
        }
      : result;
  };

  const application: ILlmApplication =
    typia.llm.application<IAutoBeTestPrepareWriteApplication>({
      validate: {
        write: validate,
      },
    });

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
