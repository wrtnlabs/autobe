import { IAgenticaController, MicroAgentica } from "@agentica/core";
import {
  AutoBeRealizeAuthorization,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import fs from "fs/promises";
import path from "path";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { orchestrateRealizeAuthorizationCorrect } from "./orchestrateRealizeAuthorizationCorrect";
import { IAutoBeRealizeAuthorizationApplication } from "./structures/IAutoBeRealizeAuthorizationApplication";
import { transformRealizeAuthorizationHistories } from "./transformRealizeAuthorization";
import { transformRealizeAuthorizationCorrectHistories } from "./transformRealizeAuthorizationCorrectHistories";
import { AuthorizationFileSystem } from "./utils/AuthorizationFileSystem";

/**
 * 1. Create decorator and its parameters. and design the Authorization Provider.
 * 2. According to Authorization Provider design, create the Provider.
 *
 * @param ctx
 */
export async function orchestrateRealizeAuthorization<
  Model extends ILlmSchema.Model,
>(ctx: AutoBeContext<Model>): Promise<AutoBeRealizeAuthorization[]> {
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
    [AuthorizationFileSystem.providerPath("jwtAuthorize")]: await fs.readFile(
      path.join(
        __dirname,
        "../../../../../internals/template/realize/src/providers/jwtAuthorize.ts",
      ),
      "utf-8",
    ),
  };

  ctx.dispatch({
    type: "realizeAuthorizationStart",
    step: ctx.state().test?.step ?? 0,
    created_at: new Date().toISOString(),
  });
  const authorizations: AutoBeRealizeAuthorization[] = await Promise.all(
    roles.map(async (role) => {
      const authorization: AutoBeRealizeAuthorization = await process(
        ctx,
        role,
        templateFiles,
      );
      ctx.dispatch({
        type: "realizeAuthorizationWrite",
        created_at: new Date().toISOString(),
        authorization: authorization,
        completed: ++completed,
        total: roles.length,
        step: ctx.state().test?.step ?? 0,
      });
      return authorization;
    }),
  );
  ctx.dispatch({
    type: "realizeAuthorizationComplete",
    created_at: new Date().toISOString(),
    step: ctx.state().test?.step ?? 0,
  });
  return authorizations;
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  role: string,
  templateFiles: Record<string, string>,
): Promise<AutoBeRealizeAuthorization> {
  const pointer: IPointer<IAutoBeRealizeAuthorizationApplication.IProps | null> =
    {
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
    histories: transformRealizeAuthorizationHistories(ctx, role),
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

  const authorization: AutoBeRealizeAuthorization = {
    role,
    decorator: {
      location: AuthorizationFileSystem.decoratorPath(
        pointer.value.decorator.name,
      ),
      name: pointer.value.decorator.name,
      content: pointer.value.decorator.content,
    },
    payload: {
      location: AuthorizationFileSystem.payloadPath(pointer.value.payload.name),
      name: pointer.value.payload.name,
      content: pointer.value.payload.content,
    },
    provider: {
      location: AuthorizationFileSystem.providerPath(
        pointer.value.provider.name,
      ),
      name: pointer.value.provider.name,
      content: pointer.value.provider.content,
    },
  };
  const compiled = ctx.state().prisma?.compiled;
  const prismaClients: Record<string, string> =
    compiled?.type === "success" ? compiled.nodeModules : {};

  return correctDecorator(ctx, authorization, prismaClients, templateFiles);
}

async function correctDecorator<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  auth: AutoBeRealizeAuthorization,
  prismaClients: Record<string, string>,
  templateFiles: Record<string, string>,
  life: number = 4,
): Promise<AutoBeRealizeAuthorization> {
  // Check Compile
  const files = {
    ...templateFiles,
    ...prismaClients,
    [auth.decorator.location]: auth.decorator.content,
    [auth.payload.location]: auth.payload.content,
    [auth.provider.location]: auth.provider.content,
  };

  const compiler: IAutoBeCompiler = await ctx.compiler();
  const result: IAutoBeTypeScriptCompileResult =
    await compiler.typescript.compile({
      files,
    });
  ctx.dispatch({
    type: "realizeAuthorizationValidate",
    created_at: new Date().toISOString(),
    result,
    authorization: auth,
    step: ctx.state().test?.step ?? 0,
  });
  if (result.type === "success") {
    return auth;
  } else if (result.type === "exception" || life === 0) {
    return auth;
  }

  const pointer: IPointer<IAutoBeRealizeAuthorizationApplication.IProps | null> =
    {
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
    histories: transformRealizeAuthorizationCorrectHistories(
      ctx,
      auth,
      templateFiles,
      result.diagnostics,
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

  const corrected: AutoBeRealizeAuthorization = {
    role: auth.role,
    decorator: {
      location: auth.decorator.location,
      name: pointer.value.decorator.name,
      content: pointer.value.decorator.content,
    },
    payload: {
      location: auth.payload.location,
      name: pointer.value.payload.name,
      content: pointer.value.payload.content,
    },
    provider: {
      location: auth.provider.location,
      name: pointer.value.provider.name,
      content: pointer.value.provider.content,
    },
  };

  const res: AutoBeRealizeAuthorization =
    await orchestrateRealizeAuthorizationCorrect(
      ctx,
      corrected,
      prismaClients,
      templateFiles,
      life - 1,
    );

  return {
    ...res,
    role: auth.role,
  };
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeRealizeAuthorizationApplication.IProps) => void;
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
    } satisfies IAutoBeRealizeAuthorizationApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeRealizeAuthorizationApplication,
  "claude",
  {
    reference: true;
  }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeRealizeAuthorizationApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
