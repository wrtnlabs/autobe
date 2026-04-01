import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeDatabaseCorrectEvent,
  AutoBeEventSource,
  IAutoBeCompiler,
  IAutoBeDatabaseValidation,
} from "@autobe/interface";
import { IPointer } from "tstl";
import typia, { IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { transformPrismaCorrectHistory } from "./histories/transformPrismaCorrectHistory";
import { AutoBeDatabaseModelProgrammer } from "./programmers/AutoBeDatabaseModelProgrammer";
import { IAutoBeDatabaseCorrectApplication } from "./structures/IAutoBeDatabaseCorrectApplication";

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
  const cyclinic = new AutoBeCyclinicController<PreliminaryKinds>({
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

  return await cyclinic.orchestrate(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | { type: "write"; data: IAutoBeDatabaseCorrectApplication.IWrite }
        | { type: "complete" }
        | null
      > = { value: null };

      const result = await ctx.conversate({
        source: SOURCE,
        controller: createController(cyclinic, { action }),
        enforceFunctionCall: true,
        ...buildHistories({
          preliminary: context.preliminary,
          failure,
          failures: context.failures,
          writeSucceeded: context.writeSucceeded,
        }),
      });

      return { result, action: action.value };
    },
    // VALIDATE: apply corrections and check with Prisma compiler
    async (writeData) => {
      const correction: AutoBeDatabase.IApplication = buildCorrection(
        failure,
        writeData.models,
      );
      const compiler: IAutoBeCompiler = await ctx.compiler();
      const validation: IAutoBeDatabaseValidation =
        await compiler.database.validate(correction);

      const targetTables = new Set(
        failure.errors.map((e) => e.table).filter((t) => t !== null),
      );
      const remainingTargetErrors: IAutoBeDatabaseValidation.IError[] =
        validation.success
          ? []
          : validation.errors.filter(
              (e) => e.table !== null && targetTables.has(e.table),
            );

      return {
        success: remainingTargetErrors.length === 0,
        diagnostics: remainingTargetErrors,
      };
    },
    // FINALIZE: dispatch event and return result
    (lastWrite, result) => {
      const correction = buildCorrection(failure, lastWrite.models);
      if (result !== null)
        ctx.dispatch({
          type: SOURCE,
          id: v7(),
          failure,
          planning: lastWrite.planning,
          correction,
          acquisition: cyclinic.getPreliminary().getAcquisition(),
          metric: result.metric,
          tokenUsage: result.tokenUsage,
          step: ctx.state().analyze?.step ?? 0,
          created_at: new Date().toISOString(),
        } satisfies AutoBeDatabaseCorrectEvent);
      return {
        type: "write" as const,
        planning: lastWrite.planning,
        models: lastWrite.models,
        correction,
      };
    },
  );
}

// ── Helpers ──

function buildCorrection(
  failure: IAutoBeDatabaseValidation.IFailure,
  correctedModels: AutoBeDatabase.IModel[],
): AutoBeDatabase.IApplication {
  return {
    files: failure.data.files.map((file) => ({
      filename: file.filename,
      namespace: file.namespace,
      models: file.models.map((model) => {
        AutoBeDatabaseModelProgrammer.emend(model);
        const newbie = correctedModels.find((m) => m.name === model.name);
        return newbie ?? model;
      }),
    })),
  };
}

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
  cyclinic: AutoBeCyclinicController<PreliminaryKinds>,
  props: {
    action: IPointer<
      | { type: "write"; data: IAutoBeDatabaseCorrectApplication.IWrite }
      | { type: "complete" }
      | null
    >;
  },
): IAgenticaController.IClass {
  const preliminary = cyclinic.getPreliminary();
  const validate: Validator = (input) => {
    const result =
      typia.validate<IAutoBeDatabaseCorrectApplication.IProps>(input);
    if (result.success === false) return result;
    const req = result.data.request;
    if (req.type !== "write" && req.type !== "complete")
      return preliminary.validate({
        thinking: result.data.thinking,
        request: req,
      });
    return result;
  };

  const application = cyclinic.fixCompleteAvailability(
    preliminary.fixApplication(
      typia.llm.application<IAutoBeDatabaseCorrectApplication>({
        validate: { process: validate },
      }),
    ),
  );

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

// ── History builder ──

function buildHistories(props: {
  preliminary: AutoBeCyclinicController.IProcessContext<PreliminaryKinds>["preliminary"];
  failure: IAutoBeDatabaseValidation.IFailure;
  failures: AutoBeCyclinicController.IFailure[];
  writeSucceeded: boolean;
}) {
  const base = transformPrismaCorrectHistory({
    preliminary: props.preliminary,
    result: props.failure,
  });

  if (props.failures.length === 0 && !props.writeSucceeded) return base;

  const failureEntries = props.failures.map((f) => {
    const errors = f.diagnostics as IAutoBeDatabaseValidation.IError[];
    return {
      id: v7(),
      type: "systemMessage" as const,
      text:
        `[Write attempt ${f.iteration + 1} FAILED] Prisma validation errors:\n` +
        errors
          .map(
            (e) =>
              `  - ${e.path}${e.table ? `:${e.table}` : ""}${e.field ? `.${e.field}` : ""}: ${e.message}`,
          )
          .join("\n"),
      created_at: new Date().toISOString(),
    };
  });

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
