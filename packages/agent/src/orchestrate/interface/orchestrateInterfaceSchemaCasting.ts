import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceSchemaCastingEvent,
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
import { transformInterfaceSchemaCastingHistory } from "./histories/transformInterfaceSchemaCastingHistory";
import { AutoBeInterfaceSchemaProgrammer } from "./programmers/AutoBeInterfaceSchemaProgrammer";
import { IAutoBeInterfaceSchemaCastingApplication } from "./structures/IAutoBeInterfaceSchemaCastingApplication";
import { AutoBeJsonSchemaFactory } from "./utils/AutoBeJsonSchemaFactory";
import { AutoBeJsonSchemaValidator } from "./utils/AutoBeJsonSchemaValidator";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

export async function orchestrateInterfaceSchemaCasting(
  ctx: AutoBeContext,
  props: {
    document: AutoBeOpenApi.IDocument;
    schemas: Record<string, AutoBeOpenApi.IJsonSchema>;
    instruction: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchema>> {
  // Filter to only process non-object type schemas (potential degenerate primitives)
  const typeNames: string[] = Object.keys(props.schemas).filter(
    (k) =>
      props.schemas[k] !== undefined &&
      AutoBeJsonSchemaValidator.isPreset(k) === false &&
      AutoBeOpenApiTypeChecker.isObject(props.schemas[k]) === false,
  );
  props.progress.total += typeNames.length;

  const x: Record<string, AutoBeOpenApi.IJsonSchema> = {};
  await executeCachedBatch(
    ctx,
    typeNames.map((it) => async (promptCacheKey) => {
      const predicate = (key: string) =>
        key === it ||
        (AutoBeJsonSchemaValidator.isPage(key) &&
          AutoBeJsonSchemaFactory.getPageName(key) === it);
      const refineOperations: AutoBeOpenApi.IOperation[] =
        props.document.operations.filter(
          (op) =>
            (op.requestBody && predicate(op.requestBody.typeName)) ||
            (op.responseBody && predicate(op.responseBody.typeName)),
        );

      const originalSchema: AutoBeOpenApi.IJsonSchema = props.schemas[it];
      const refined: AutoBeOpenApi.IJsonSchema | null = await process(ctx, {
        instruction: props.instruction,
        document: props.document,
        typeName: it,
        refineOperations,
        originalSchema,
        progress: props.progress,
        promptCacheKey,
      });
      if (refined !== null) x[it] = refined;
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
    originalSchema: AutoBeOpenApi.IJsonSchema;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeOpenApi.IJsonSchema | null> {
  const everyModels: AutoBeDatabase.IModel[] =
    ctx.state().database?.result.data.files.flatMap((f) => f.models) ?? [];

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
      typia.json.application<IAutoBeInterfaceSchemaCastingApplication>(),
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
      interfaceOperations: props.refineOperations,
      interfaceSchemas: {
        // actually not "AutoBeOpenApi.IJsonSchemaDescriptive" type
        [props.typeName]:
          props.originalSchema as AutoBeOpenApi.IJsonSchemaDescriptive,
      },
      databaseSchemas:
        AutoBeInterfaceSchemaProgrammer.getNeighborDatabaseSchemas({
          typeName: props.typeName,
          application: ctx.state().database!.result.data,
        }),
    },
  });

  const value = await cyclinic.orchestrate<
    IAutoBeInterfaceSchemaCastingApplication.IWrite,
    AutoBeOpenApi.IJsonSchemaDescriptive.IObject | false
  >(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeInterfaceSchemaCastingApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          typeName: props.typeName,
          operations: props.document.operations,
          schema: props.originalSchema,
          everyModels,
          cyclinic,
          action,
        }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...transformInterfaceSchemaCastingHistory({
          state: ctx.state(),
          instruction: props.instruction,
          typeName: props.typeName,
          refineOperations: props.refineOperations,
          originalSchema: props.originalSchema,
          preliminary: context.preliminary,
        }),
      });
      return { result, action: action.value };
    },
    // VALIDATE: run business logic validation
    async (writeData) => {
      const errors: IValidation.IError[] = [];
      if (writeData.casting !== null)
        AutoBeInterfaceSchemaProgrammer.validate({
          path: "$input.request.design",
          errors,
          everyModels,
          operations: props.document.operations,
          typeName: props.typeName,
          design: writeData.casting,
        });
      if (errors.length !== 0)
        return { success: false, diagnostics: errors };
      return { success: true };
    },
    // FINALIZE: build result, dispatch event, return
    async (lastWrite, result) => {
      const refinedSchema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject | null =
        lastWrite.casting !== null
          ? (AutoBeJsonSchemaFactory.fixDesign(
              lastWrite.casting,
            ) as AutoBeOpenApi.IJsonSchemaDescriptive.IObject)
          : null;

      if (result !== null)
        ctx.dispatch({
          type: SOURCE,
          id: v7(),
          typeName: props.typeName,
          original: props.originalSchema,
          observation: lastWrite.observation,
          reasoning: lastWrite.reasoning,
          verdict: lastWrite.verdict,
          refined: refinedSchema,
          acquisition: cyclinic.getPreliminary().getAcquisition(),
          metric: result.metric,
          tokenUsage: result.tokenUsage,
          step: ctx.state().analyze?.step ?? 0,
          total: props.progress.total,
          completed: ++props.progress.completed,
          created_at: new Date().toISOString(),
        } satisfies AutoBeInterfaceSchemaCastingEvent);

      return refinedSchema ?? false;
    },
  );
  return value || null;
}

function createController(props: {
    typeName: string;
    schema: AutoBeOpenApi.IJsonSchema;
    operations: AutoBeOpenApi.IOperation[];
    everyModels: AutoBeDatabase.IModel[];
    action: IPointer<
      | {
          type: "write";
          data: IAutoBeInterfaceSchemaCastingApplication.IWrite;
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
    const result: IValidation<IAutoBeInterfaceSchemaCastingApplication.IProps> =
      typia.validate<IAutoBeInterfaceSchemaCastingApplication.IProps>(next);
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
      typia.llm.application<IAutoBeInterfaceSchemaCastingApplication>({
        validate: {
          process: validate,
        },
      }),
    ),
  );
  AutoBeInterfaceSchemaProgrammer.fixApplication({
    application,
    everyModels: props.everyModels,
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
    } satisfies IAutoBeInterfaceSchemaCastingApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemaCastingApplication.IProps>;

const SOURCE = "interfaceSchemaCasting" satisfies AutoBeEventSource;
