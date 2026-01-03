import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeDatabaseCorrectEvent,
  AutoBeEventSource,
  IAutoBeCompiler,
  IAutoBeDatabaseValidation,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaCorrectHistory } from "./histories/transformPrismaCorrectHistory";
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
  return iterate(ctx, application, Math.max(ctx.retry, 8));
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
  const next: IExecutionResult = await process(ctx, result);
  return iterate(ctx, next.correction, life - 1);
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
    type: "complete",
    planning: plannings.join("\n\n"),
    models: Object.values(models),
    correction,
  };
}

async function execute(
  ctx: AutoBeContext,
  failure: IAutoBeDatabaseValidation.IFailure,
): Promise<IExecutionResult> {
  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeDatabaseCorrectApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "previousAnalysisFiles",
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
      prisma: "ast",
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeDatabaseCorrectApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        preliminary,
        build: (next) => {
          pointer.value = next;
        },
      }),
      enforceFunctionCall: true,
      ...transformPrismaCorrectHistory({
        preliminary,
        result: failure,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const correction: AutoBeDatabase.IApplication = {
      files: failure.data.files.map((file) => ({
        filename: file.filename,
        namespace: file.namespace,
        models: file.models.map((model) => {
          const newbie = pointer.value?.models.find(
            (m) => m.name === model.name,
          );
          return newbie ?? model;
        }),
      })),
    };
    ctx.dispatch({
      type: SOURCE,
      id: v7(),
      failure,
      planning: pointer.value.planning,
      correction: correction,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      step: ctx.state().analyze?.step ?? 0,
      created_at: new Date().toISOString(),
    } satisfies AutoBeDatabaseCorrectEvent);
    return out(result)({
      ...pointer.value,
      correction,
    });
  });
}

interface IExecutionResult extends IAutoBeDatabaseCorrectApplication.IComplete {
  correction: AutoBeDatabase.IApplication;
}

const getTableCount = (failure: IAutoBeDatabaseValidation.IFailure): number => {
  const unique: Set<string | null> = new Set(
    failure.errors.map((error) => error.table ?? null),
  );
  return unique.size;
};

function createController(props: {
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "previousAnalysisFiles"
    | "databaseSchemas"
    | "previousDatabaseSchemas"
  >;
  build: (next: IAutoBeDatabaseCorrectApplication.IComplete) => void;
}): IAgenticaController.IClass {
  const validate: Validator = (input) => {
    const result =
      typia.validate<IAutoBeDatabaseCorrectApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "complete")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking,
      request: result.data.request,
    });
  };
  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeDatabaseCorrectApplication>({
      validate: {
        process: validate,
      },
    }),
  );
  return {
    protocol: "class",
    name: SOURCE satisfies AutoBeEventSource,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBeDatabaseCorrectApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeDatabaseCorrectApplication.IProps>;

const SOURCE = "databaseCorrect" satisfies AutoBeEventSource;
