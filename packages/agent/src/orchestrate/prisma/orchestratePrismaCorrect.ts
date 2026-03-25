import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeDatabaseCorrectEvent,
  AutoBeEventSource,
  IAutoBeCompiler,
  IAutoBeDatabaseValidation,
} from "@autobe/interface";
import { LlmTypeChecker } from "@typia/utils";
import { IPointer } from "tstl";
import typia, { ILlmApplication, ILlmSchema, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { orchestratePreliminary } from "../common/orchestratePreliminary";
import { transformPrismaCorrectHistory } from "./histories/transformPrismaCorrectHistory";
import { AutoBeDatabaseModelProgrammer } from "./programmers/AutoBeDatabaseModelProgrammer";
import { IAutoBeDatabaseCorrectApplication } from "./structures/IAutoBeDatabaseCorrectApplication";

const MAX_WRITE_ATTEMPTS = 3;

export function orchestratePrismaCorrect(
  ctx: AutoBeContext,
  application: AutoBeDatabase.IApplication,
): Promise<IAutoBeDatabaseValidation> {
  const unique: Set<string> = new Set();
  for (const file of application.files)
    file.models = file.models.filter((model) => {
      if (unique.has(model.name)) return false;
      unique.add(model.name);
      return true;
    });
  application.files = application.files.filter((f) => f.models.length !== 0);
  return iterate(ctx, application);
}

// ── Types ──

type PreliminaryKinds =
  | "analysisSections"
  | "databaseSchemas"
  | "previousAnalysisSections"
  | "previousDatabaseSchemas";

interface IWriteFailure {
  errors: IAutoBeDatabaseValidation.IError[];
  iteration: number;
}

// ── Outer loop: validate → batch correct → re-validate ──

async function iterate(
  ctx: AutoBeContext,
  application: AutoBeDatabase.IApplication,
): Promise<IAutoBeDatabaseValidation> {
  for (
    let life = AutoBeConfigConstant.DATABASE_CORRECT_RETRY;
    life >= 0;
    life--
  ) {
    const compiler: IAutoBeCompiler = await ctx.compiler();
    const result: IAutoBeDatabaseValidation =
      await compiler.database.validate(application);
    if (result.success) return result;

    // VALIDATION FAILED — dispatch event
    const schemas: Record<string, string> =
      await compiler.database.writePrismaSchemas(application, "postgres");
    ctx.dispatch({
      type: "databaseValidate",
      id: v7(),
      result,
      schemas,
      compiled: await compiler.database.compilePrismaSchemas({
        files: schemas,
      }),
      step: ctx.state().analyze?.step ?? 0,
      created_at: new Date().toISOString(),
    });

    // Correct via batching
    try {
      const corrected = await process(ctx, result);
      application = corrected.correction;
    } catch (error) {
      console.log("prismaCorrect iterate failure", error);
      // keep current application and retry
    }
  }

  // Exhausted — return final validation result
  const compiler: IAutoBeCompiler = await ctx.compiler();
  return compiler.database.validate(application);
}

// ── Batch processing ──

async function process(
  ctx: AutoBeContext,
  failure: IAutoBeDatabaseValidation.IFailure,
  capacity: number = 8,
): Promise<IExecutionResult> {
  const count: number = getTableCount(failure);
  if (count <= capacity) return execute(ctx, failure);

  let correction: AutoBeDatabase.IApplication = failure.data;
  const volume: number = Math.ceil(count / capacity);
  const plannings: string[] = [];
  const models: Record<string, AutoBeDatabase.IModel> = {};
  let i: number = 0;

  while (i++ < volume && failure.errors.length !== 0) {
    const next: IExecutionResult = await execute(ctx, {
      ...failure,
      errors: (() => {
        const unique: Set<string | null> = new Set();
        const errors: IAutoBeDatabaseValidation.IError[] = [];
        for (const err of failure.errors) {
          unique.add(err.table ?? null);
          if (unique.size > capacity) break;
          else errors.push(err);
        }
        return errors;
      })(),
    });
    plannings.push(next.planning);
    for (const m of next.models) models[m.name] = m;

    const compiler: IAutoBeCompiler = await ctx.compiler();
    const result: IAutoBeDatabaseValidation = await compiler.database.validate(
      next.correction,
    );
    correction = next.correction;
    if (result.success === true) break;
    else failure = result;
  }
  return {
    type: "write",
    planning: plannings.join("\n\n"),
    models: Object.values(models),
    correction,
  };
}

// ── Cyclinic execute: write-validate-correct loop per batch ──

async function execute(
  ctx: AutoBeContext,
  failure: IAutoBeDatabaseValidation.IFailure,
): Promise<IExecutionResult> {
  const preliminary = new AutoBePreliminaryController<PreliminaryKinds>({
    application: typia.json.application<IAutoBeDatabaseCorrectApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "previousAnalysisSections",
      "databaseSchemas",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
    all: {
      databaseSchemas: failure.data.files.map((f) => f.models).flat(),
    },
    local: {
      databaseSchemas: Array.from(
        new Set(failure.errors.map((e) => e.table).filter((t) => t !== null)),
      )
        .map((table: string): AutoBeDatabase.IModel | undefined =>
          failure.data.files
            .map((f) => f.models)
            .flat()
            .find((m) => m.name === table),
        )
        .filter((m) => m !== undefined),
    },
    config: {
      database: "ast",
    },
  });

  // Write-validate-correct loop state
  let lastWrite: IAutoBeDatabaseCorrectApplication.IWrite | null = null;
  let lastCorrection: AutoBeDatabase.IApplication | null = null;
  let writeSucceeded = false;
  const writeFailures: IWriteFailure[] = [];
  const sourceId = v7();

  const maxIterations = MAX_WRITE_ATTEMPTS * 3; // preliminary + write + complete headroom

  for (let i = 0; i < maxIterations; i++) {
    const action: IPointer<
      | { type: "write"; data: IAutoBeDatabaseCorrectApplication.IWrite }
      | { type: "complete" }
      | null
    > = { value: null };

    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController(ctx, {
        preliminary,
        writeSucceeded,
        action,
      }),
      enforceFunctionCall: true,
      ...buildHistories({
        preliminary,
        failure,
        failures: writeFailures,
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

    // WRITE — apply corrections and validate
    if (action.value.type === "write") {
      const writeData = action.value.data;

      // Apply corrections to the application
      const correction: AutoBeDatabase.IApplication = {
        files: failure.data.files.map((file) => ({
          filename: file.filename,
          namespace: file.namespace,
          models: file.models.map((model) => {
            AutoBeDatabaseModelProgrammer.emend(model);
            const newbie = writeData.models.find(
              (m) => m.name === model.name,
            );
            return newbie ?? model;
          }),
        })),
      };

      // Validate the corrected application
      const compiler: IAutoBeCompiler = await ctx.compiler();
      const validation: IAutoBeDatabaseValidation =
        await compiler.database.validate(correction);

      // Check if target table errors are resolved
      const targetTables = new Set(
        failure.errors.map((e) => e.table).filter((t) => t !== null),
      );
      const remainingTargetErrors: IAutoBeDatabaseValidation.IError[] =
        validation.success
          ? []
          : validation.errors.filter((e) => targetTables.has(e.table));

      if (remainingTargetErrors.length === 0) {
        lastWrite = writeData;
        lastCorrection = validation.success ? validation.data : correction;
        writeSucceeded = true;
      } else {
        writeFailures.push({ errors: remainingTargetErrors, iteration: i });
        if (writeFailures.length >= MAX_WRITE_ATTEMPTS) {
          // Exhausted — use last correction if available, otherwise original
          if (lastCorrection !== null && lastWrite !== null) {
            return {
              type: "write",
              planning: lastWrite.planning,
              models: lastWrite.models,
              correction: lastCorrection,
            };
          }
          throw new Error(
            `prismaCorrect: exhausted ${MAX_WRITE_ATTEMPTS} write attempts`,
          );
        }
      }
      continue;
    }

    // COMPLETE — finalize
    if (
      action.value.type === "complete" &&
      lastWrite !== null &&
      lastCorrection !== null
    ) {
      ctx.dispatch({
        type: SOURCE,
        id: v7(),
        failure,
        planning: lastWrite.planning,
        correction: lastCorrection,
        acquisition: preliminary.getAcquisition(),
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        step: ctx.state().analyze?.step ?? 0,
        created_at: new Date().toISOString(),
      } satisfies AutoBeDatabaseCorrectEvent);
      return {
        type: "write",
        planning: lastWrite.planning,
        models: lastWrite.models,
        correction: lastCorrection,
      };
    }
  }

  // Exhausted iterations — use last successful write if available
  if (lastWrite !== null && lastCorrection !== null) {
    return {
      type: "write",
      planning: lastWrite.planning,
      models: lastWrite.models,
      correction: lastCorrection,
    };
  }
  throw new Error("prismaCorrect: exhausted all iterations");
}

// ── Types ──

interface IExecutionResult extends IAutoBeDatabaseCorrectApplication.IWrite {
  correction: AutoBeDatabase.IApplication;
}

const getTableCount = (failure: IAutoBeDatabaseValidation.IFailure): number => {
  const unique: Set<string | null> = new Set(
    failure.errors.map((error) => error.table ?? null),
  );
  return unique.size;
};

// ── Controller factory ──

function createController(
  _ctx: AutoBeContext,
  props: {
    preliminary: AutoBePreliminaryController<PreliminaryKinds>;
    writeSucceeded: boolean;
    action: IPointer<
      | { type: "write"; data: IAutoBeDatabaseCorrectApplication.IWrite }
      | { type: "complete" }
      | null
    >;
  },
): IAgenticaController.IClass {
  const validate: Validator = (input) => {
    const result =
      typia.validate<IAutoBeDatabaseCorrectApplication.IProps>(input);
    if (result.success === false) return result;
    const req = result.data.request;
    if (req.type !== "write" && req.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: req,
      });
    return result;
  };

  let application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeDatabaseCorrectApplication>({
      validate: {
        process: validate,
      },
    }),
  );
  application = fixCompleteAvailability(application, props.writeSucceeded);

  return {
    protocol: "class",
    name: SOURCE satisfies AutoBeEventSource,
    application,
    execute: {
      process: (input) => {
        if (input.request.type === "write")
          props.action.value = { type: "write", data: input.request };
        else if (input.request.type === "complete")
          props.action.value = { type: "complete" };
      },
    } satisfies IAutoBeDatabaseCorrectApplication,
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
      ? (((anyOfSchema as unknown as Record<string, unknown>)[
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
  preliminary: AutoBePreliminaryController<PreliminaryKinds>;
  failure: IAutoBeDatabaseValidation.IFailure;
  failures: IWriteFailure[];
  writeSucceeded: boolean;
}) {
  const base = transformPrismaCorrectHistory({
    preliminary: props.preliminary,
    result: props.failure,
  });

  if (props.failures.length === 0 && !props.writeSucceeded) return base;

  const failureEntries = props.failures.map((f) => ({
    id: v7(),
    type: "systemMessage" as const,
    text:
      `[Write attempt ${f.iteration + 1} FAILED] Prisma validation errors:\n` +
      f.errors
        .map(
          (e) =>
            `  - ${e.path}${e.table ? `:${e.table}` : ""}${e.field ? `.${e.field}` : ""}: ${e.message}`,
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
            "Your last write attempt passed Prisma validation successfully. " +
            "You may now call complete to finalize.",
          created_at: new Date().toISOString(),
        },
      ]
    : [];

  return {
    ...base,
    histories: [...base.histories, ...failureEntries, ...successEntries],
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeDatabaseCorrectApplication.IProps>;

const SOURCE = "databaseCorrect" satisfies AutoBeEventSource;
