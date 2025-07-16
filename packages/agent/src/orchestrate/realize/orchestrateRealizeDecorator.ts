import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeRealizeDecoratorEvent } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import fs from "fs/promises";
import path from "path";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { IAutoBeRealizeDecoratorApplication } from "./structures/IAutoBeRealizeDecoratorApplication";
import { transformRealizeDecoratorHistories } from "./transformRealizeDecorator";
import { transformRealizeDecoratorCorrectHistories } from "./transformRealizeDecoratorCorrectHistories";

/**
 * 1. Create decorator and its parameters. and design the Authorization Provider.
 * 2. According to Authorization Provider design, create the Provider.
 *
 * @param ctx
 */
export async function orchestrateRealizeDecorator<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
): Promise<IAutoBeRealizeDecoratorApplication.IProps[]> {
  const compiled = ctx.state().prisma?.compiled;

  const prismaClients: Record<string, string> =
    compiled?.type === "success" ? compiled.nodeModules : {};

  const roles = Array.from(
    new Set(
      ctx
        .state()
        .interface?.document.operations.map(
          (operation) => operation.authorization?.role,
        )
        .flat()
        .filter((role) => role !== undefined),
    ),
  );

  const files: Record<string, string> = {};
  const decorators: IAutoBeRealizeDecoratorApplication.IProps[] = [];

  let completed = 0;

  const templateFiles = {
    "src/MyGlobal.ts": await fs.readFile(
      path.join(__dirname, "../../../../../internals/template/src/MyGlobal.ts"),
      "utf-8",
    ),
    "src/authentications/jwtAuthorize.ts": await fs.readFile(
      path.join(
        __dirname,
        "../../../../../internals/template/src/providers/jwtAuthorize.ts",
      ),
      "utf-8",
    ),
  };

  for (const role of roles) {
    const decorator: IAutoBeRealizeDecoratorApplication.IProps = await process(
      ctx,
      role,
      templateFiles,
      prismaClients,
    );

    files[`src/decorators/${decorator.decorator.name}.ts`] =
      decorator.decorator.code;
    files[`src/authentications/${decorator.provider.name}.ts`] =
      decorator.provider.code;

    decorators.push(decorator);
    completed++;
  }

  const events: AutoBeRealizeDecoratorEvent = {
    type: "realizeDecorator",
    created_at: new Date().toISOString(),
    files,
    completed,
    total: roles.length,
    step: ctx.state().test?.step ?? 0,
  };

  ctx.dispatch(events);

  return decorators;
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  role: string,
  templateFiles: Record<string, string>,
  prismaClients: Record<string, string>,
): Promise<IAutoBeRealizeDecoratorApplication.IProps> {
  const pointer: IPointer<IAutoBeRealizeDecoratorApplication.IProps | null> = {
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
    histories: transformRealizeDecoratorHistories(role, prismaClients),
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

  await agentica
    .conversate("Create Authorization Provider and Decorator.")
    .finally(() => {
      const tokenUsage = agentica.getTokenUsage();
      ctx.usage().record(tokenUsage, ["realize"]);
    });

  if (pointer.value === null) throw new Error("Failed to create decorator.");

  return await correctDecorator(
    ctx,
    pointer.value,
    prismaClients,
    templateFiles,
  );
}

async function correctDecorator<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  result: IAutoBeRealizeDecoratorApplication.IProps,
  prismaClients: Record<string, string>,
  templateFiles: Record<string, string>,
  life: number = 4,
): Promise<IAutoBeRealizeDecoratorApplication.IProps> {
  // Check Compile
  const files = {
    ...templateFiles,
    ...prismaClients,
    [`src/decorators/${result.decorator.name}.ts`]: result.decorator.code,
    [`src/authentications/${result.provider.name}.ts`]: result.provider.code,
  };

  const compiled = await ctx.compiler.typescript.compile({
    files,
  });

  if (compiled.type === "success") {
    return result;
  } else if (compiled.type === "exception" || life === 0) {
    // TODO: Add Failure Event Dispatch
    return result;
  }

  const pointer: IPointer<IAutoBeRealizeDecoratorApplication.IProps | null> = {
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
    histories: transformRealizeDecoratorCorrectHistories(
      result,
      prismaClients,
      templateFiles,
      compiled.diagnostics,
    ),
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

  await agentica
    .conversate("Please correct the decorator and the provider.")
    .finally(() => {
      const tokenUsage = agentica.getTokenUsage();
      ctx.usage().record(tokenUsage, ["realize"]);
    });

  if (pointer.value === null) throw new Error("Failed to correct decorator.");

  return await correctDecorator(
    ctx,
    pointer.value,
    prismaClients,
    templateFiles,
    life - 1,
  );
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeRealizeDecoratorApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;

  return {
    protocol: "class",
    name: "Create Decorator",
    application,
    execute: {
      createDecorator: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeRealizeDecoratorApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeRealizeDecoratorApplication,
  "claude",
  {
    reference: true;
  }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeRealizeDecoratorApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
