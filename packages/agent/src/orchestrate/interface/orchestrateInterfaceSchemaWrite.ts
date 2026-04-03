import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceSchemaDesign,
  AutoBeInterfaceSchemaEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { IPointer } from "tstl";
import typia, { ILlmSchema, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { transformInterfaceSchemaWriteHistory } from "./histories/transformInterfaceSchemaWriteHistory";
import { AutoBeInterfaceSchemaProgrammer } from "./programmers/AutoBeInterfaceSchemaProgrammer";
import { IAutoBeInterfaceSchemaApplication } from "./structures/IAutoBeInterfaceSchemaApplication";
import { AutoBeJsonSchemaFactory } from "./utils/AutoBeJsonSchemaFactory";
import { AutoBeJsonSchemaValidator } from "./utils/AutoBeJsonSchemaValidator";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

export async function orchestrateInterfaceSchemaWrite(
  ctx: AutoBeContext,
  props: {
    operations: AutoBeOpenApi.IOperation[];
    instruction: string;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchema>> {
  // gather type names
  const collection: Set<string> = new Set();
  const gather = (key: string): void => {
    if (AutoBeJsonSchemaValidator.isPage(key))
      collection.add(AutoBeJsonSchemaFactory.getPageName(key));
    collection.add(key);
  };
  for (const op of props.operations) {
    if (op.requestBody !== null) gather(op.requestBody.typeName);
    if (op.responseBody !== null) gather(op.responseBody.typeName);
  }
  const presets: Record<string, AutoBeOpenApi.IJsonSchema> =
    AutoBeJsonSchemaFactory.presets(collection);

  // divide and conquer
  const typeNames: string[] = Array.from(collection).filter(
    (k) => AutoBeJsonSchemaValidator.isPreset(k) === false,
  );
  const progress: AutoBeProgressEventBase = {
    total: typeNames.length,
    completed: 0,
  };
  const x: Record<string, AutoBeOpenApi.IJsonSchema> = {
    ...presets,
  };
  await executeCachedBatch(
    ctx,
    typeNames.map((it) => async (promptCacheKey) => {
      const predicate = (key: string) =>
        key === it ||
        (AutoBeJsonSchemaValidator.isPage(key) &&
          AutoBeJsonSchemaFactory.getPageName(key) === it);
      const operations: AutoBeOpenApi.IOperation[] = props.operations.filter(
        (op) =>
          (op.requestBody && predicate(op.requestBody.typeName)) ||
          (op.responseBody && predicate(op.responseBody.typeName)),
      );
      try {
        const row: AutoBeOpenApi.IJsonSchema = await forceRetry(() =>
          process(ctx, {
            operations,
            progress,
            otherTypeNames: typeNames.filter((k) => k !== it),
            promptCacheKey,
            typeName: it,
            instruction: props.instruction,
          }),
        );
        x[it] = row;
      } catch (error) {
        --progress.total;
        console.log("interfaceSchema failure", it, error);
      }
    }),
  );
  return x;
}

// ── Types ──

type PreliminaryKinds =
  | "analysisSections"
  | "databaseSchemas"
  | "interfaceOperations"
  | "previousAnalysisSections"
  | "previousDatabaseSchemas"
  | "previousInterfaceOperations"
  | "previousInterfaceSchemas";

// ── Main process ──

async function process(
  ctx: AutoBeContext,
  props: {
    operations: AutoBeOpenApi.IOperation[];
    typeName: string;
    otherTypeNames: string[];
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<AutoBeOpenApi.IJsonSchema> {
  const everyModels: AutoBeDatabase.IModel[] =
    ctx.state().database?.result.data.files.flatMap((f) => f.models) ?? [];

  const cyclinic = new AutoBeCyclinicController<PreliminaryKinds>({
    application: typia.json.application<IAutoBeInterfaceSchemaApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "databaseSchemas",
      "interfaceOperations",
      "previousAnalysisSections",
      "previousDatabaseSchemas",
      "previousInterfaceOperations",
      "previousInterfaceSchemas",
    ],
    config: {
      database: "text",
      databaseProperty: true,
    },
    state: ctx.state(),
    all: {
      interfaceOperations: props.operations,
    },
    local: {
      interfaceOperations: props.operations.filter((o) => {
        const predicate = (key: string) =>
          key === props.typeName ||
          (AutoBeJsonSchemaValidator.isPage(key) &&
            AutoBeJsonSchemaFactory.getPageName(key) === props.typeName);
        return (
          (o.requestBody && predicate(o.requestBody.typeName)) ||
          (o.responseBody && predicate(o.responseBody.typeName))
        );
      }),
      databaseSchemas:
        AutoBeInterfaceSchemaProgrammer.getNeighborDatabaseSchemas({
          typeName: props.typeName,
          application: ctx.state().database!.result.data,
        }),
    },
  });

  return await cyclinic.orchestrate(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | { type: "write"; data: IAutoBeInterfaceSchemaApplication.IWrite }
        | { type: "complete" }
        | null
      > = { value: null };

      const result = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          everyModels,
          cyclinic,
          action,
          operations: props.operations,
          typeName: props.typeName,
        }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...buildHistories({
          operations: props.operations,
          typeName: props.typeName,
          otherTypeNames: props.otherTypeNames,
          preliminary: context.preliminary,
          instruction: props.instruction,
          failures: context.failures,
          writeSucceeded: context.writeSucceeded,
        }),
      });

      return { result, action: action.value };
    },
    // VALIDATE: schema validation
    async (writeData) => {
      const errors: IValidation.IError[] = [];
      AutoBeInterfaceSchemaProgrammer.validate({
        path: "$input.request.design",
        errors,
        operations: props.operations,
        everyModels,
        typeName: props.typeName,
        design: writeData.design,
      });
      return { success: errors.length === 0, diagnostics: errors };
    },
    // FINALIZE: dispatch event and return schema
    (lastWrite, result) => {
      const schema: AutoBeOpenApi.IJsonSchema =
        AutoBeJsonSchemaFactory.fixDesign(lastWrite.design);
      if (result !== null)
        ctx.dispatch({
          type: SOURCE,
          id: v7(),
          typeName: props.typeName,
          analysis: lastWrite.analysis,
          rationale: lastWrite.rationale,
          schema,
          acquisition: cyclinic.getPreliminary().getAcquisition(),
          metric: result.metric,
          tokenUsage: result.tokenUsage,
          completed: ++props.progress.completed,
          total: props.progress.total,
          step: ctx.state().database?.step ?? 0,
          created_at: new Date().toISOString(),
        } satisfies AutoBeInterfaceSchemaEvent);
      return schema;
    },
  );
}

// ── Controller factory ──

function createController(props: {
  everyModels: AutoBeDatabase.IModel[];
  cyclinic: AutoBeCyclinicController<PreliminaryKinds>;
  action: IPointer<
    | { type: "write"; data: IAutoBeInterfaceSchemaApplication.IWrite }
    | { type: "complete" }
    | null
  >;
  operations: AutoBeOpenApi.IOperation[];
  typeName: string;
}): IAgenticaController.IClass {
  const preliminary = props.cyclinic.getPreliminary();
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeInterfaceSchemaApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceSchemaApplication.IProps> =
      typia.validate<IAutoBeInterfaceSchemaApplication.IProps>(input);
    if (result.success === false) {
      fulfillJsonSchemaErrorMessages(result.errors);
      return result;
    }
    const req = result.data.request;
    if (req.type !== "write" && req.type !== "complete")
      return preliminary.validate({
        thinking: result.data.thinking,
        request: req,
      });
    return result;
  };

  let application = preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfaceSchemaApplication>({
      validate: { process: validate },
    }),
  );
  if (
    AutoBeJsonSchemaValidator.isObjectType({
      operations: props.operations,
      typeName: props.typeName,
    }) === true
  )
    (
      (
        application.functions[0].parameters.$defs[
          typia.reflect.name<AutoBeInterfaceSchemaDesign>()
        ] as ILlmSchema.IObject
      ).properties.schema as ILlmSchema.IReference
    ).$ref = "AutoBeOpenApi.IJsonSchema.IObject";
  AutoBeInterfaceSchemaProgrammer.fixApplication({
    application,
    everyModels: props.everyModels,
  });
  application = props.cyclinic.fixCompleteAvailability(application);

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
    } satisfies IAutoBeInterfaceSchemaApplication,
  };
}

// ── History builder ──

function buildHistories(props: {
  operations: AutoBeOpenApi.IOperation[];
  typeName: string;
  otherTypeNames: string[];
  preliminary: AutoBeCyclinicController.IProcessContext<PreliminaryKinds>["preliminary"];
  instruction: string;
  failures: AutoBeCyclinicController.IFailure[];
  writeSucceeded: boolean;
}) {
  const base = transformInterfaceSchemaWriteHistory({
    preliminary: props.preliminary,
    operations: props.operations,
    instruction: props.instruction,
    typeName: props.typeName,
    otherTypeNames: props.otherTypeNames,
  });

  if (props.failures.length === 0 && !props.writeSucceeded) return base;

  const failureEntries = props.failures.map((f) => {
    const text =
      typeof f.diagnostics === "string"
        ? `[Iteration ${f.iteration + 1}] ${f.diagnostics}`
        : `[Write attempt ${f.iteration + 1} FAILED] Schema validation errors:\n` +
          (f.diagnostics as IValidation.IError[])
            .map(
              (e) =>
                `  - ${e.path}: expected ${e.expected}, got ${JSON.stringify(e.value)}${e.description ? ` \u2014 ${e.description}` : ""}`,
            )
            .join("\n");
    return {
      id: v7(),
      type: "systemMessage" as const,
      text,
      created_at: new Date().toISOString(),
    };
  });

  const successEntries = props.writeSucceeded
    ? [
        {
          id: v7(),
          type: "systemMessage" as const,
          text:
            "Your last write attempt passed schema validation successfully. " +
            "You may now call complete(confirm: true) to finalize.",
          created_at: new Date().toISOString(),
        },
      ]
    : [];

  return {
    ...base,
    histories: [...base.histories, ...failureEntries, ...successEntries],
  };
}

const SOURCE = "interfaceSchema" satisfies AutoBeEventSource;
