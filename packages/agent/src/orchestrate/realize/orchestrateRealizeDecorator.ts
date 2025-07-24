import { IAgenticaController, MicroAgentica } from "@agentica/core";
import {
  AutoBeRealizeDecorator,
  AutoBeRealizeDecoratorEvent,
  IAutoBeCompiler,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import fs from "fs/promises";
import path from "path";
import { IPointer } from "tstl";
import typia from "typia";
import { v4 } from "uuid";

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
>(ctx: AutoBeContext<Model>): Promise<AutoBeRealizeDecoratorEvent[]> {
  const roles =
    ctx
      .state()
      .interface?.document.components.authorization?.map((auth) => auth.name) ??
    [];

  let completed = 0;

  const templateFiles = {
    "src/MyGlobal.ts": await fs.readFile(
      path.join(
        __dirname,
        "../../../../../internals/template/realize/src/MyGlobal.ts",
      ),
      "utf-8",
    ),
    "src/authentications/jwtAuthorize.ts": await fs.readFile(
      path.join(
        __dirname,
        "../../../../../internals/template/realize/src/providers/jwtAuthorize.ts",
      ),
      "utf-8",
    ),
  };

  const files: Record<string, string> = {
    ...templateFiles,
  };

  const decorators: AutoBeRealizeDecorator[] = [];

  const events: AutoBeRealizeDecoratorEvent[] = await Promise.all(
    roles.map(async (role) => {
      const decorator: IAutoBeRealizeDecoratorApplication.IProps =
        await process(ctx, role, templateFiles);

      files[`src/decorators/${decorator.decorator.name}.ts`] =
        decorator.decorator.code;
      files[`src/authentications/${decorator.provider.name}.ts`] =
        decorator.provider.code;
      files[`src/authentications/types/${decorator.payload.name}.ts`] =
        decorator.payload.code;

      decorators.push({
        name: decorator.decorator.name,
        role,
        payload: decorator.payload,
        location: `src/decorators/${decorator.decorator.name}.ts`,
      });

      const event: AutoBeRealizeDecoratorEvent = {
        type: "realizeDecorator",
        created_at: new Date().toISOString(),
        role,
        provider: decorator.provider,
        decorator: decorator.decorator,
        payload: decorator.payload,
        completed: ++completed,
        total: roles.length,
        step: ctx.state().test?.step ?? 0,
      };

      ctx.dispatch(event);

      return event;
    }),
  );

  const realize = ctx.state().realize;

  if (realize !== null) {
    realize.decorators = decorators;
  } else {
    ctx.state().realize = {
      type: "realize",
      id: v4(),
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      reason: ctx.state().analyze?.reason ?? "",
      step: ctx.state().analyze?.step ?? 0,
      files: [],
      decorators,
      compiled: { type: "success" },
    };
  }

  return events;
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  role: string,
  templateFiles: Record<string, string>,
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
    histories: transformRealizeDecoratorHistories(ctx, role),
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

  const compiled = ctx.state().prisma?.compiled;

  const prismaClients: Record<string, string> =
    compiled?.type === "success" ? compiled.nodeModules : {};

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
    [`src/authentications/types/${result.payload.name}.ts`]:
      result.payload.code,
  };

  const compiler: IAutoBeCompiler = await ctx.compiler();

  const compiled = await compiler.typescript.compile({
    files,
  });

  ctx.dispatch({
    type: "realizeDecoratorValidate",
    created_at: new Date().toISOString(),
    result: compiled,
    files,
    step: ctx.state().test?.step ?? 0,
  });

  if (compiled.type === "success") {
    return result;
  } else if (compiled.type === "exception" || life === 0) {
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
      ctx,
      result,
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

  const correctedFiles: Record<string, string> = {
    ...files,
    [`src/decorators/${pointer.value.decorator.name}.ts`]:
      pointer.value.decorator.code,
    [`src/authentications/${pointer.value.provider.name}.ts`]:
      pointer.value.provider.code,
    [`src/authentications/types/${pointer.value.payload.name}.ts`]:
      pointer.value.payload.code,
  };

  ctx.dispatch({
    type: "realizeDecoratorCorrect",
    created_at: new Date().toISOString(),
    files: correctedFiles,
    result: compiled,
    step: ctx.state().test?.step ?? 0,
  });

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
