import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceSchemaRefineEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
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
    schemas: Record<string, AutoBeOpenApi.IJsonSchema>;
    instruction: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  // Filter to only process object-type schemas (non-preset and object type)
  const typeNames: string[] = Object.entries(props.schemas)
    .filter(
      ([k, v]) =>
        AutoBeJsonSchemaValidator.isPreset(k) === false &&
        AutoBeOpenApiTypeChecker.isObject(v),
    )
    .map(([k]) => k);
  props.progress.total += typeNames.length;

  const x: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
  await executeCachedBatch(
    ctx,
    typeNames.map((it) => async (promptCacheKey) => {
      const predicate = (key: string) => key === it;
      const operations: AutoBeOpenApi.IOperation[] =
        props.document.operations.filter(
          (op) =>
            (op.requestBody && predicate(op.requestBody.typeName)) ||
            (op.responseBody && predicate(op.responseBody.typeName)),
        );
      try {
        const schema: AutoBeOpenApi.IJsonSchema = props.schemas[it];
        if (AutoBeOpenApiTypeChecker.isObject(schema) === false) {
          --props.progress.total;
          return;
        }
        const refined: AutoBeOpenApi.IJsonSchemaDescriptive.IObject =
          await process(ctx, {
            instruction: props.instruction,
            document: props.document,
            typeName: it,
            operations,
            schema,
            progress: props.progress,
            promptCacheKey,
          });
        x[it] = refined;
      } catch (error) {
        console.log("interfaceSchemaRefine failure", it, error);
        --props.progress.total;
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
    operations: AutoBeOpenApi.IOperation[];
    schema: AutoBeOpenApi.IJsonSchema.IObject;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeOpenApi.IJsonSchemaDescriptive.IObject> {
  const cyclinic = new AutoBeCyclinicController<
    | "analysisSections"
    | "databaseSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
    | "previousInterfaceSchemas"
  >({
    application:
      typia.json.application<IAutoBeInterfaceSchemaRefineApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "previousAnalysisSections",
      "databaseSchemas",
      "previousDatabaseSchemas",
      "interfaceOperations",
      "previousInterfaceOperations",
      "interfaceSchemas",
      "previousInterfaceSchemas",
    ],
    config: {
      database: "text",
      databaseProperty: true,
    },
    state: ctx.state(),
    all: {
      interfaceOperations: props.document.operations,
      interfaceSchemas: props.document.components.schemas,
    },
    local: {
      interfaceOperations: props.operations,
      interfaceSchemas: {
        [props.typeName]: props.schema as AutoBeOpenApi.IJsonSchemaDescriptive,
      },
      databaseSchemas: (() => {
        const expected: string =
          props.schema["x-autobe-database-schema"] ??
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

  return cyclinic.orchestrate(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeInterfaceSchemaRefineApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController(ctx, {
          typeName: props.typeName,
          operations: props.document.operations,
          schema: props.schema,
          cyclinic,
          action,
        }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...transformInterfaceSchemaRefineHistory({
          state: ctx.state(),
          instruction: props.instruction,
          typeName: props.typeName,
          operations: props.operations,
          schema: props.schema,
          preliminary: context.preliminary,
        }),
      });
      return { result, action: action.value };
    },
    // VALIDATE: run business logic validation
    async (writeData) => {
      const errors: IValidation.IError[] = [];
      AutoBeInterfaceSchemaRefineProgrammer.validate({
        typeName: props.typeName,
        schema: props.schema,
        everyModels:
          ctx.state().database?.result.data.files.flatMap((f) => f.models) ??
          [],
        databaseSchema: writeData.databaseSchema,
        excludes: writeData.excludes,
        revises: writeData.revises,
        errors,
        path: `$input.request`,
      });
      if (errors.length) {
        return { success: false, diagnostics: errors };
      }
      return { success: true };
    },
    // FINALIZE: build refined schema, dispatch event, return
    async (lastWrite, result) => {
      const content: AutoBeOpenApi.IJsonSchemaDescriptive.IObject =
        AutoBeInterfaceSchemaRefineProgrammer.execute({
          schema: props.schema,
          databaseSchema: lastWrite.databaseSchema,
          specification: lastWrite.specification,
          description: lastWrite.description,
          revises: lastWrite.revises,
        });
      if (result !== null)
        ctx.dispatch({
          type: SOURCE,
          id: v7(),
          typeName: props.typeName,
          schema: props.schema,
          review: lastWrite.review,
          databaseSchema: lastWrite.databaseSchema,
          specification: lastWrite.specification,
          description: lastWrite.description,
          excludes: lastWrite.excludes,
          revises: lastWrite.revises,
          acquisition: cyclinic.getPreliminary().getAcquisition(),
          metric: result.metric,
          tokenUsage: result.tokenUsage,
          step: ctx.state().analyze?.step ?? 0,
          total: props.progress.total,
          completed: ++props.progress.completed,
          created_at: new Date().toISOString(),
        } satisfies AutoBeInterfaceSchemaRefineEvent);
      return content;
    },
  );
}

function createController(
  ctx: AutoBeContext,
  props: {
    typeName: string;
    schema: AutoBeOpenApi.IJsonSchema.IObject;
    operations: AutoBeOpenApi.IOperation[];
    action: IPointer<
      | {
          type: "write";
          data: IAutoBeInterfaceSchemaRefineApplication.IWrite;
        }
      | { type: "complete" }
      | null
    >;
    cyclinic: AutoBeCyclinicController<
      | "analysisSections"
      | "databaseSchemas"
      | "interfaceOperations"
      | "interfaceSchemas"
      | "previousAnalysisSections"
      | "previousDatabaseSchemas"
      | "previousInterfaceOperations"
      | "previousInterfaceSchemas"
    >;
  },
): IAgenticaController.IClass {
  const preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
    | "previousInterfaceSchemas"
  > = props.cyclinic.getPreliminary();

  const validate: Validator = (next) => {
    const result: IValidation<IAutoBeInterfaceSchemaRefineApplication.IProps> =
      typia.validate<IAutoBeInterfaceSchemaRefineApplication.IProps>(next);
    if (result.success === false) {
      fulfillJsonSchemaErrorMessages(result.errors);
      return result;
    }
    const req = result.data.request;
    if (req.type === "write" || req.type === "complete") return result;
    return preliminary.validate({
      thinking: result.data.thinking,
      request: req,
    });
  };

  const application: ILlmApplication = props.cyclinic.fixCompleteAvailability(
    preliminary.fixApplication(
      typia.llm.application<IAutoBeInterfaceSchemaRefineApplication>({
        validate: {
          process: validate,
        },
      }),
    ),
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
        if (input.request.type === "write")
          props.action.value = { type: "write", data: input.request };
        else if (input.request.type === "complete")
          props.action.value = { type: "complete" };
      },
    } satisfies IAutoBeInterfaceSchemaRefineApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemaRefineApplication.IProps>;

const SOURCE = "interfaceSchemaRefine" satisfies AutoBeEventSource;
