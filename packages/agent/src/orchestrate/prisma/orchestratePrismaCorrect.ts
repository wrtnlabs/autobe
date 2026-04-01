import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeDatabaseCorrectEvent,
  AutoBeEventSource,
  IAutoBeCompiler,
  IAutoBeDatabaseValidation,
} from "@autobe/interface";
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
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
  return iterate(ctx, application, AutoBeConfigConstant.DATABASE_CORRECT_RETRY);
}

async function iterate(
  ctx: AutoBeContext,
  application: AutoBeDatabase.IApplication,
  life: number,
): Promise<IAutoBeDatabaseValidation> {
  const compiler: IAutoBeCompiler = await ctx.compiler();
  const result: IAutoBeDatabaseValidation =
    await compiler.database.validate(application);
  if (result.success)
    return result; // SUCCESS
  else if (life < 0) return result; // FAILURE

  // VALIDATION FAILED
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

  const data: AutoBeDatabase.IApplication = await (async () => {
    try {
      const next: IExecutionResult = await process(ctx, result);
      return next.correction;
    } catch (error) {
      console.log("prismaCorrect iterate failure", error);
      return result.data;
    }
  })();
  return await iterate(ctx, data, life - 1);
}

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

// ── Types ──

type PreliminaryKinds =
  | "analysisSections"
  | "databaseSchemas"
  | "previousAnalysisSections"
  | "previousDatabaseSchemas";

// ── execute: unified write-accumulate-correct loop ──

async function execute(
  ctx: AutoBeContext,
  failure: IAutoBeDatabaseValidation.IFailure,
): Promise<IExecutionResult> {
  const cyclinic = new AutoBeCyclinicController<PreliminaryKinds>({
    source: SOURCE,
    application: typia.json.application<IAutoBeDatabaseCorrectApplication>(),
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

  // Track the most recently submitted write for history delivery
  let previousWrite: IAutoBeDatabaseCorrectApplication.IWrite | null = null;

  return await cyclinic.orchestrate(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | { type: "write"; data: IAutoBeDatabaseCorrectApplication.IWrite }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({ cyclinic, action }),
        enforceFunctionCall: true,
        ...transformPrismaCorrectHistory({
          preliminary: context.preliminary,
          result: failure,
          previousWrite,
        }),
      });

      return { result, action: action.value };
    },
    // VALIDATE: no compilation in inner loop — always succeed.
    // Capture the submitted write data so the next iteration can show it in
    // history, giving the LLM full context of what it already tried.
    async (writeData) => {
      previousWrite = writeData;
      return { success: true };
    },
    // FINALIZE: build correction and dispatch event
    async (lastWrite, result) => {
      const correction: AutoBeDatabase.IApplication = {
        files: failure.data.files.map((file) => ({
          filename: file.filename,
          namespace: file.namespace,
          models: file.models.map((model) => {
            AutoBeDatabaseModelProgrammer.emend(model);
            const newbie = lastWrite.models.find((m) => m.name === model.name);
            return newbie ?? model;
          }),
        })),
      };
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
      return { ...lastWrite, correction };
    },
  );
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

function createController(props: {
  cyclinic: AutoBeCyclinicController<PreliminaryKinds>;
  action: IPointer<
    | { type: "write"; data: IAutoBeDatabaseCorrectApplication.IWrite }
    | { type: "complete" }
    | null
  >;
}): IAgenticaController.IClass {
  const preliminary = props.cyclinic.getPreliminary();
  const validate: Validator = (input) => {
    const result =
      typia.validate<IAutoBeDatabaseCorrectApplication.IProps>(input);
    if (result.success === false) return result;
    const req = result.data.request;
    if (req.type === "write" || req.type === "complete") return result;
    return preliminary.validate({
      thinking: result.data.thinking,
      request: req,
    });
  };
  const application: ILlmApplication = props.cyclinic.fixCompleteAvailability(
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

type Validator = (
  input: unknown,
) => IValidation<IAutoBeDatabaseCorrectApplication.IProps>;

const SOURCE = "databaseCorrect" satisfies AutoBeEventSource;
