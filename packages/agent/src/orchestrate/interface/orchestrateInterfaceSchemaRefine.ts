import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceSchemaRefineEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { AutoBeDatabaseModelProgrammer } from "../prisma/programmers/AutoBeDatabaseModelProgrammer";
import { transformInterfaceSchemaRefineHistory } from "./histories/transformInterfaceSchemaRefineHistory";
import { AutoBeInterfaceSchemaProgrammer } from "./programmers/AutoBeInterfaceSchemaProgrammer";
import { AutoBeInterfaceSchemaRefineProgrammer } from "./programmers/AutoBeInterfaceSchemaRefineProgrammer";
import { IAutoBeInterfaceSchemaRefineApplication } from "./structures/IAutoBeInterfaceSchemaRefineApplication";
import { AutoBeJsonSchemaValidator } from "./utils/AutoBeJsonSchemaValidator";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

export async function orchestrateInterfaceSchemaRefine(
  ctx: AutoBeContext,
  props: {
    document: AutoBeOpenApi.IDocument;
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    instruction: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  // Filter to only process object-type schemas (non-preset and object type)
  const typeNames: string[] = Object.entries(props.schemas)
    .filter(
      ([k, v]) =>
        AutoBeJsonSchemaValidator.isPreset(k) === false &&
        AutoBeOpenApiTypeChecker.isObject(v) &&
        Object.keys(v.properties).length !== 0,
    )
    .map(([k]) => k);
  props.progress.total += typeNames.length;

  const x: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
  await executeCachedBatch(
    ctx,
    typeNames.map((it) => async (promptCacheKey) => {
      const predicate = (key: string) => key === it;
      const refineOperations: AutoBeOpenApi.IOperation[] =
        props.document.operations.filter(
          (op) =>
            (op.requestBody && predicate(op.requestBody.typeName)) ||
            (op.responseBody && predicate(op.responseBody.typeName)),
        );
      try {
        const value: AutoBeOpenApi.IJsonSchemaDescriptive = props.schemas[it];
        if (AutoBeOpenApiTypeChecker.isObject(value) === false) {
          ++props.progress.completed;
          return;
        }
        const refined: AutoBeOpenApi.IJsonSchemaDescriptive.IObject =
          await process(ctx, {
            instruction: props.instruction,
            document: props.document,
            typeName: it,
            refineOperations,
            refineSchema: value,
            progress: props.progress,
            promptCacheKey,
          });
        x[it] = refined;
      } catch {
        ++props.progress.completed;
      }
    }),
  );
  return x;
}

async function process(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    typeName: string;
    refineOperations: AutoBeOpenApi.IOperation[];
    refineSchema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeOpenApi.IJsonSchemaDescriptive.IObject> {
  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
    | "previousInterfaceSchemas"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceSchemaRefineApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "previousAnalysisFiles",
      "databaseSchemas",
      "previousDatabaseSchemas",
      "interfaceOperations",
      "previousInterfaceOperations",
      "interfaceSchemas",
      "previousInterfaceSchemas",
    ],
    state: ctx.state(),
    all: {
      interfaceOperations: props.document.operations,
      interfaceSchemas: props.document.components.schemas,
    },
    local: {
      interfaceOperations: props.refineOperations,
      interfaceSchemas: { [props.typeName]: props.refineSchema },
      databaseSchemas: (() => {
        const expected: string =
          props.refineSchema["x-autobe-database-schema"] ??
          AutoBeInterfaceSchemaProgrammer.getDatabaseSchemaName(props.typeName);
        const model: AutoBeDatabase.IModel | undefined = ctx
          .state()
          .database?.result.data.files.flatMap((f) => f.models)
          .find((m) => m.name === expected);
        if (model === undefined) return [];
        return AutoBeDatabaseModelProgrammer.getNeighbors({
          application: ctx.state().database!.result.data,
          model,
        });
      })(),
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeInterfaceSchemaRefineApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController(ctx, {
        typeName: props.typeName,
        operations: props.document.operations,
        schema: props.refineSchema,
        preliminary,
        pointer,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformInterfaceSchemaRefineHistory({
        state: ctx.state(),
        instruction: props.instruction,
        typeName: props.typeName,
        refineOperations: props.refineOperations,
        refineSchema: props.refineSchema,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    // Apply refines to generate the enriched schema content
    const content: AutoBeOpenApi.IJsonSchemaDescriptive.IObject =
      AutoBeInterfaceSchemaRefineProgrammer.refine({
        schema: props.refineSchema,
        databaseSchema: pointer.value.databaseSchema,
        specification: pointer.value.specification,
        description: pointer.value.description,
        refines: pointer.value.refines,
      });
    ctx.dispatch({
      type: SOURCE,
      id: v7(),
      typeName: props.typeName,
      schema: props.refineSchema,
      review: pointer.value.review,
      databaseSchema: pointer.value.databaseSchema,
      specification: pointer.value.specification,
      description: pointer.value.description,
      refines: pointer.value.refines,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      step: ctx.state().analyze?.step ?? 0,
      total: props.progress.total,
      completed: ++props.progress.completed,
      created_at: new Date().toISOString(),
    } satisfies AutoBeInterfaceSchemaRefineEvent);
    return out(result)(content);
  });
}

function createController(
  ctx: AutoBeContext,
  props: {
    typeName: string;
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    operations: AutoBeOpenApi.IOperation[];
    pointer: IPointer<
      IAutoBeInterfaceSchemaRefineApplication.IComplete | null | false
    >;
    preliminary: AutoBePreliminaryController<
      | "analysisFiles"
      | "databaseSchemas"
      | "interfaceOperations"
      | "interfaceSchemas"
      | "previousAnalysisFiles"
      | "previousDatabaseSchemas"
      | "previousInterfaceOperations"
      | "previousInterfaceSchemas"
    >;
  },
): IAgenticaController.IClass {
  const validate: Validator = (next) => {
    const result: IValidation<IAutoBeInterfaceSchemaRefineApplication.IProps> =
      typia.validate<IAutoBeInterfaceSchemaRefineApplication.IProps>(next);
    if (result.success === false) {
      fulfillJsonSchemaErrorMessages(result.errors);
      return result;
    } else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = [];
    AutoBeInterfaceSchemaRefineProgrammer.validate(ctx, {
      typeName: props.typeName,
      schema: props.schema,
      refines: result.data.request.refines,
      errors,
      path: `$input.request`,
    });
    return errors.length
      ? {
          success: false,
          errors,
          data: result.data,
        }
      : result;
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfaceSchemaRefineApplication>({
      validate: {
        process: validate,
      },
    }),
  );
  AutoBeInterfaceSchemaRefineProgrammer.fixApplication({
    everyModels:
      ctx.state().database?.result.data.files.flatMap((f) => f.models) ?? [],
    application,
    typeName: props.typeName,
    schema: props.schema,
  });

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (input) => {
        if (input.request.type === "complete")
          props.pointer.value = input.request;
      },
    } satisfies IAutoBeInterfaceSchemaRefineApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemaRefineApplication.IProps>;

const SOURCE = "interfaceSchemaRefine" satisfies AutoBeEventSource;
