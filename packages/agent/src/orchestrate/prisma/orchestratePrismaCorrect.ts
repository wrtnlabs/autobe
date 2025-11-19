import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBePrisma,
  AutoBePrismaCorrectEvent,
  IAutoBeCompiler,
  IAutoBePrismaValidation,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaCorrectHistory } from "./histories/transformPrismaCorrectHistory";
import { IAutoBePrismaCorrectApplication } from "./structures/IAutoBePrismaCorrectApplication";

export function orchestratePrismaCorrect<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  application: AutoBePrisma.IApplication,
): Promise<IAutoBePrismaValidation> {
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

async function iterate<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  application: AutoBePrisma.IApplication,
  life: number,
): Promise<IAutoBePrismaValidation> {
  const compiler: IAutoBeCompiler = await ctx.compiler();
  const result: IAutoBePrismaValidation =
    await compiler.prisma.validate(application);
  if (result.success)
    return result; // SUCCESS
  else if (life < 0) return result; // FAILURE

  // VALIDATION FAILED
  const schemas: Record<string, string> = await compiler.prisma.write(
    application,
    "postgres",
  );
  ctx.dispatch({
    type: "prismaValidate",
    id: v7(),
    result,
    schemas,
    compiled: await compiler.prisma.compile({
      files: schemas,
    }),
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  });
  const next: IExecutionResult = await process(ctx, result);
  return iterate(ctx, next.correction, life - 1);
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  failure: IAutoBePrismaValidation.IFailure,
  capacity: number = 8,
): Promise<IExecutionResult> {
  const count: number = getTableCount(failure);
  if (count <= capacity) return execute(ctx, failure);

  let correction: AutoBePrisma.IApplication = failure.data;
  const volume: number = Math.ceil(count / capacity);
  const plannings: string[] = [];
  const models: Record<string, AutoBePrisma.IModel> = {};
  let i: number = 0;

  while (i++ < volume && failure.errors.length !== 0) {
    const next: IExecutionResult = await execute(ctx, {
      ...failure,
      errors: (() => {
        const unique: Set<string | null> = new Set();
        const errors: IAutoBePrismaValidation.IError[] = [];
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
    const result: IAutoBePrismaValidation = await compiler.prisma.validate(
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

async function execute<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  failure: IAutoBePrismaValidation.IFailure,
): Promise<IExecutionResult> {
  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "prismaSchemas"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBePrismaCorrectApplication>(),
    source: SOURCE,
    kinds: ["analysisFiles", "prismaSchemas"],
    state: ctx.state(),
    all: {
      prismaSchemas: failure.data.files.map((f) => f.models).flat(),
    },
    local: {
      prismaSchemas: Array.from(
        new Set(failure.errors.map((e) => e.table).filter((t) => t !== null)),
      )
        .map((table: string): AutoBePrisma.IModel | undefined =>
          failure.data.files
            .map((f) => f.models)
            .flat()
            .find((m) => m.name === table),
        )
        .filter((m) => m !== undefined),
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBePrismaCorrectApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        preliminary,
        model: ctx.model,
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
    if (pointer.value !== null) {
      const correction: AutoBePrisma.IApplication = {
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
      } satisfies AutoBePrismaCorrectEvent);
      return out(result)({
        ...pointer.value,
        correction,
      });
    }
    return out(result)(null);
  });
}

interface IExecutionResult extends IAutoBePrismaCorrectApplication.IComplete {
  correction: AutoBePrisma.IApplication;
}

const getTableCount = (failure: IAutoBePrismaValidation.IFailure): number => {
  const unique: Set<string | null> = new Set(
    failure.errors.map((error) => error.table ?? null),
  );
  return unique.size;
};

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  preliminary: AutoBePreliminaryController<"analysisFiles" | "prismaSchemas">;
  build: (next: IAutoBePrismaCorrectApplication.IComplete) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);
  const validate: Validator = (input) => {
    const result =
      typia.validate<IAutoBePrismaCorrectApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "complete")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking,
      request: result.data.request,
    });
  };
  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt"
      ? "chatgpt"
      : props.model === "gemini"
        ? "gemini"
        : "claude"
  ](
    validate,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: SOURCE satisfies AutoBeEventSource,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBePrismaCorrectApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBePrismaCorrectApplication, "chatgpt">({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBePrismaCorrectApplication, "claude">({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBePrismaCorrectApplication, "gemini">({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBePrismaCorrectApplication.IProps>;

const SOURCE = "prismaCorrect" satisfies AutoBeEventSource;
