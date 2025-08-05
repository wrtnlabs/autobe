import { IAgenticaController, MicroAgentica } from "@agentica/core";
import {
  AutoBePrisma,
  IAutoBeCompiler,
  IAutoBePrismaValidation,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
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
  return step(ctx, application, life);
}

async function step<Model extends ILlmSchema.Model>(
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
  const next: IAutoBePrismaCorrectApplication.IProps = await forceRetry(() =>
    process(ctx, result),
  );
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
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  });
  return step(
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
): Promise<IAutoBePrismaCorrectApplication.IProps> {
  // PREPARE AGENTICA
  const pointer: IPointer<IAutoBePrismaCorrectApplication.IProps | null> = {
    value: null,
  };
  const agentica: MicroAgentica<Model> = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...(ctx.config ?? {}),
      executor: {
        describe: null,
      },
    },
    histories: transformPrismaCorrectHistories(failure),
    controllers: [
      createApplication({
        model: ctx.model,
        build: (next) => {
          pointer.value = next;
        },
      }),
    ],
  });
  enforceToolCall(agentica);

  // REQUEST CORRECTION
  await agentica
    .conversate(
      "Resolve the compilation errors in the provided Prisma schema files.",
    )
    .finally(() => {
      const tokenUsage = agentica.getTokenUsage().aggregate;
      ctx.usage().record(tokenUsage, ["prisma"]);
    });
  if (pointer.value === null)
    throw new Error(
      "Unreachable error: PrismaCompilerAgent.pointer.value is null",
    );
  return pointer.value;
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBePrismaCorrectApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
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

const claude = typia.llm.application<
  IAutoBePrismaCorrectApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBePrismaCorrectApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
