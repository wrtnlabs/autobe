import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeRealizeAuthorization, IAutoBeCompiler } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { orchestrateRealizeAuthorizationCorrect } from "./orchestrateRealizeAuthorizationCorrect";
import { IAutoBeRealizeAuthorizationApplication } from "./structures/IAutoBeRealizeAuthorizationApplication";
import { transformRealizeAuthorizationHistories } from "./transformRealizeAuthorization";
import { AuthorizationFileSystem } from "./utils/AuthorizationFileSystem";
import { InternalFileSystem } from "./utils/InternalFileSystem";

/**
 * 1. Create decorator and its parameters. and design the Authorization Provider.
 * 2. According to Authorization Provider design, create the Provider.
 *
 * @param ctx
 */
export async function orchestrateRealizeAuthorization<
  Model extends ILlmSchema.Model,
>(ctx: AutoBeContext<Model>): Promise<AutoBeRealizeAuthorization[]> {
  const roles = ctx.state().analyze?.roles.map((role) => role.name) ?? [];

  let completed = 0;

  const templateFiles = await (await ctx.compiler()).realize.getTemplate();

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
        InternalFileSystem.DEFAULT.map((el) => ({
          [el]: templateFiles[el],
        })).reduce((acc, cur) => Object.assign(acc, cur), {}),
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
      const tokenUsage = agentica.getTokenUsage().aggregate;
      ctx.usage().record(tokenUsage, ["realize"]);
    });
  if (pointer.value === null) throw new Error("Failed to create decorator.");

  const compiler: IAutoBeCompiler = await ctx.compiler();
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
      content: await compiler.typescript.beautify(
        pointer.value.payload.content,
      ),
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

  return orchestrateRealizeAuthorizationCorrect(
    ctx,
    authorization,
    prismaClients,
    templateFiles,
  );
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
