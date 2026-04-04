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
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
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

async function execute(
  ctx: AutoBeContext,
  failure: IAutoBeDatabaseValidation.IFailure,
): Promise<IExecutionResult> {
  const preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
  > = new AutoBePreliminaryController({
    dispatch: (e) => ctx.dispatch(e),
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
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeDatabaseCorrectApplication.IWrite | null> = {
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
          AutoBeDatabaseModelProgrammer.emend(model);
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
      acquisition: preliminary.getAcquisition(),
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

interface IExecutionResult extends IAutoBeDatabaseCorrectApplication.IWrite {
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
    | "analysisSections"
    | "previousAnalysisSections"
    | "databaseSchemas"
    | "previousDatabaseSchemas"
  >;
  build: (next: IAutoBeDatabaseCorrectApplication.IWrite) => void;
}): IAgenticaController.IClass {
  const validate: Validator = (input) => {
    const result =
      typia.validate<IAutoBeDatabaseCorrectApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "write")
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
        if (next.request.type === "write") props.build(next.request);
      },
    } satisfies IAutoBeDatabaseCorrectApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeDatabaseCorrectApplication.IProps>;

const SOURCE = "databaseCorrect" satisfies AutoBeEventSource;
