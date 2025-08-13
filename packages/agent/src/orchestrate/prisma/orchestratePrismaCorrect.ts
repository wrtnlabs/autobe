import { IAgenticaController } from "@agentica/core";
import {
  AutoBePrisma,
  IAutoBeCompiler,
  IAutoBePrismaValidation,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeTokenUsage } from "../../context/AutoBeTokenUsage";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { forceRetry } from "../../utils/forceRetry";
import { transformPrismaCorrectHistories } from "./histories/transformPrismaCorrectHistories";
import { IAutoBePrismaCorrectApplication } from "./structures/IAutoBePrismaCorrectApplication";

export function orchestratePrismaCorrect<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  application: AutoBePrisma.IApplication,
  life: number = 4,
): Promise<IAutoBePrismaValidation> {
  const unique: Set<string> = new Set();
  for (const file of application.files)
    file.models = file.models.filter((model) => {
      if (unique.has(model.name)) return false;
      unique.add(model.name);
      return true;
    });
  application.files = application.files.filter((f) => f.models.length !== 0);
  return iterate(ctx, application, life);
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
  else if (life <= 0) return result; // FAILURE

  // VALIDATION FAILED
  const schemas: Record<string, string> = await compiler.prisma.write(
    application,
    "postgres",
  );
  ctx.dispatch({
    type: "prismaValidate",
    result,
    schemas,
    compiled: await compiler.prisma.compile({
      files: schemas,
    }),
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  });
  const next: IExecutionResult = await process(ctx, result);
  const correction: AutoBePrisma.IApplication = {
    files: application.files.map((file) => ({
      filename: file.filename,
      namespace: file.namespace,
      models: file.models.map((model) => {
        const newbie = next.models.find((m) => m.name === model.name);
        return newbie ?? model;
      }),
    })),
  };
  ctx.dispatch({
    type: "prismaCorrect",
    failure: result,
    correction,
    planning: next.planning,
    tokenUsage: next.tokenUsage,
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  });
  return iterate(
    ctx,
    {
      files: correction.files,
    },
    life - 1,
  );
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  failure: IAutoBePrismaValidation.IFailure,
  capacity: number = 8,
): Promise<IExecutionResult> {
  const count: number = getTableCount(failure);
  if (count <= capacity) return forceRetry(() => execute(ctx, failure));

  const volume: number = Math.ceil(count / capacity);
  const plannings: string[] = [];
  const models: Record<string, AutoBePrisma.IModel> = {};
  const tokenUsage: AutoBeTokenUsage = new AutoBeTokenUsage();
  let i: number = 0;

  while (i++ < volume && failure.errors.length !== 0) {
    const next: IExecutionResult = await forceRetry(() =>
      execute(ctx, {
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
      }),
    );
    tokenUsage.record(next.tokenUsage, ["prisma"]);
    plannings.push(next.planning);
    for (const m of next.models) models[m.name] = m;

    const compiler: IAutoBeCompiler = await ctx.compiler();
    const application: AutoBePrisma.IApplication = {
      ...failure.data,
      files: failure.data.files.map((file) => ({
        ...file,
        models: file.models.map((m) => models[m.name] ?? m),
      })),
    };
    const result: IAutoBePrismaValidation =
      await compiler.prisma.validate(application);
    if (result.success === true) break;
    else failure = result;
  }
  return {
    planning: plannings.join("\n\n"),
    models: Object.values(models),
    tokenUsage: tokenUsage.toJSON().aggregate,
  };
}

async function execute<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  failure: IAutoBePrismaValidation.IFailure,
): Promise<IExecutionResult> {
  // PREPARE AGENTICA
  const pointer: IPointer<IAutoBePrismaCorrectApplication.IProps | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "prismaCorrect",
    histories: transformPrismaCorrectHistories(failure),
    controller: createController({
      model: ctx.model,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    message:
      "Resolve the compilation errors in the provided Prisma schema files.",
  });
  if (pointer.value === null)
    throw new Error(
      "Unreachable error: PrismaCompilerAgent.pointer.value is null",
    );
  return {
    ...pointer.value,
    tokenUsage,
  };
}

interface IExecutionResult extends IAutoBePrismaCorrectApplication.IProps {
  tokenUsage: IAutoBeTokenUsageJson.IComponent;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBePrismaCorrectApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Prisma Compiler",
    application,
    execute: {
      correctPrismaSchemaFiles: (next) => {
        props.build(next);
      },
    } satisfies IAutoBePrismaCorrectApplication,
  };
}

const getTableCount = (failure: IAutoBePrismaValidation.IFailure): number => {
  const unique: Set<string | null> = new Set(
    failure.errors.map((error) => error.table ?? null),
  );
  return unique.size;
};

const claude = typia.llm.application<
  IAutoBePrismaCorrectApplication,
  "claude"
>();
const collection = {
  chatgpt: typia.llm.application<IAutoBePrismaCorrectApplication, "chatgpt">(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
