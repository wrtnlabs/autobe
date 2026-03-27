import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceSchemaDesign,
  AutoBeInterfaceSchemaEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { LlmTypeChecker } from "@typia/utils";
import { IPointer } from "tstl";
import typia, { ILlmApplication, ILlmSchema, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { orchestratePreliminary } from "../common/orchestratePreliminary";
import { transformInterfaceSchemaWriteHistory } from "./histories/transformInterfaceSchemaWriteHistory";
import { AutoBeInterfaceSchemaProgrammer } from "./programmers/AutoBeInterfaceSchemaProgrammer";
import { IAutoBeInterfaceSchemaApplication } from "./structures/IAutoBeInterfaceSchemaApplication";
import { AutoBeJsonSchemaFactory } from "./utils/AutoBeJsonSchemaFactory";
import { AutoBeJsonSchemaValidator } from "./utils/AutoBeJsonSchemaValidator";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

const MAX_WRITE_ATTEMPTS = 3;

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

interface IWriteFailure {
  errors: IValidation.IError[];
  iteration: number;
}

// ── Main loop ──

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

  const preliminary = new AutoBePreliminaryController<PreliminaryKinds>({
    application:
      typia.json.application<IAutoBeInterfaceSchemaApplication>(),
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

  // Write-validate-correct loop state
  let lastWrite: IAutoBeInterfaceSchemaApplication.IWrite | null = null;
  let writeSucceeded = false;
  const failures: IWriteFailure[] = [];
  const sourceId = v7();

  const maxIterations = MAX_WRITE_ATTEMPTS * 3;

  for (let i = 0; i < maxIterations; i++) {
    const action: IPointer<
      | { type: "write"; data: IAutoBeInterfaceSchemaApplication.IWrite }
      | { type: "complete" }
      | null
    > = { value: null };

    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        everyModels,
        preliminary,
        writeSucceeded,
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
        preliminary,
        instruction: props.instruction,
        failures,
        writeSucceeded,
      }),
    });

    // PRELIMINARY — delegate and continue
    if (action.value === null) {
      await orchestratePreliminary(ctx, {
        source_id: sourceId,
        source: SOURCE,
        preliminary,
        trial: i + 1,
        histories: result.histories,
      });
      continue;
    }

    // WRITE — validate externally
    if (action.value.type === "write") {
      const writeData = action.value.data;
      const errors: IValidation.IError[] = [];
      AutoBeInterfaceSchemaProgrammer.validate({
        path: "$input.request.design",
        errors,
        operations: props.operations,
        everyModels,
        typeName: props.typeName,
        design: writeData.design,
      });

      if (errors.length === 0) {
        lastWrite = writeData;
        writeSucceeded = true;
      } else {
        failures.push({ errors, iteration: i });
        if (failures.length >= MAX_WRITE_ATTEMPTS) {
          throw new Error(
            `interfaceSchemaWrite: ${props.typeName} exhausted ${MAX_WRITE_ATTEMPTS} write attempts`,
          );
        }
      }
      continue;
    }

    // COMPLETE — finalize
    if (action.value.type === "complete" && lastWrite !== null) {
      const schema: AutoBeOpenApi.IJsonSchema =
        AutoBeJsonSchemaFactory.fixDesign(lastWrite.design);
      ctx.dispatch({
        type: SOURCE,
        id: v7(),
        typeName: props.typeName,
        analysis: lastWrite.analysis,
        rationale: lastWrite.rationale,
        schema,
        acquisition: preliminary.getAcquisition(),
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        completed: ++props.progress.completed,
        total: props.progress.total,
        step: ctx.state().database?.step ?? 0,
        created_at: new Date().toISOString(),
      } satisfies AutoBeInterfaceSchemaEvent);
      return schema;
    }
  }

  // Exhausted iterations — use last successful write if available
  if (lastWrite !== null) {
    return AutoBeJsonSchemaFactory.fixDesign(lastWrite.design);
  }
  throw new Error(
    `interfaceSchemaWrite: ${props.typeName} exhausted all iterations`,
  );
}

// ── Controller factory ──

function createController(props: {
  everyModels: AutoBeDatabase.IModel[];
  preliminary: AutoBePreliminaryController<PreliminaryKinds>;
  writeSucceeded: boolean;
  action: IPointer<
    | { type: "write"; data: IAutoBeInterfaceSchemaApplication.IWrite }
    | { type: "complete" }
    | null
  >;
  operations: AutoBeOpenApi.IOperation[];
  typeName: string;
}): IAgenticaController.IClass {
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
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: req,
      });
    return result;
  };

  let application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfaceSchemaApplication>({
      validate: {
        process: validate,
      },
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
  application = fixCompleteAvailability(application, props.writeSucceeded);

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

// ── Schema manipulation ──

/** Removes IComplete from the request union when no write has succeeded. */
function fixCompleteAvailability(
  application: ILlmApplication,
  writeSucceeded: boolean,
): ILlmApplication {
  if (writeSucceeded) return application;

  const func = application.functions.find((f) => f.name === "process");
  if (func === undefined) return application;

  const request: ILlmSchema | undefined = func.parameters.properties.request;
  if (request === undefined) return application;
  if (LlmTypeChecker.isAnyOf(request) === false) return application;

  // biome-ignore lint: type narrowing insufficient after isAnyOf guard
  const anyOfSchema = request as ILlmSchema.IAnyOf;
  const children = anyOfSchema.anyOf as ILlmSchema.IReference[];
  // biome-ignore lint: x-discriminator is a runtime extension property
  const mapping: Record<string, string> =
    (anyOfSchema as unknown as Record<string, unknown>)["x-discriminator"] !=
    null
      ? ((
          (anyOfSchema as unknown as Record<string, unknown>)[
            "x-discriminator"
          ] as Record<string, Record<string, string>>
        ).mapping ?? {})
      : {};

  const completeIdx = children.findIndex(
    (c) => c.$ref.endsWith("/IComplete") || c.$ref.endsWith(".IComplete"),
  );
  if (completeIdx !== -1) children.splice(completeIdx, 1);
  delete mapping["complete"];

  return application;
}

// ── History builder ──

function buildHistories(props: {
  operations: AutoBeOpenApi.IOperation[];
  typeName: string;
  otherTypeNames: string[];
  preliminary: AutoBePreliminaryController<PreliminaryKinds>;
  instruction: string;
  failures: IWriteFailure[];
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

  const failureEntries = props.failures.map((f) => ({
    id: v7(),
    type: "systemMessage" as const,
    text:
      `[Write attempt ${f.iteration + 1} FAILED] Schema validation errors:\n` +
      f.errors
        .map(
          (e) =>
            `  - ${e.path}: expected ${e.expected}, got ${JSON.stringify(e.value)}${e.description ? ` \u2014 ${e.description}` : ""}`,
        )
        .join("\n"),
    created_at: new Date().toISOString(),
  }));

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
