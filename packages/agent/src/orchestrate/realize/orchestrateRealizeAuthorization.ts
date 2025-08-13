import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeRole,
  AutoBeRealizeAuthorization,
  AutoBeRealizeAuthorizationWriteEvent,
  IAutoBeCompiler,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { IProgress } from "../internal/IProgress";
import { transformRealizeAuthorizationHistories } from "./histories/transformRealizeAuthorization";
import { orchestrateRealizeAuthorizationCorrect } from "./orchestrateRealizeAuthorizationCorrect";
import { IAutoBeRealizeAuthorizationApplication } from "./structures/IAutoBeRealizeAuthorizationApplication";
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
  ctx.dispatch({
    type: "realizeAuthorizationStart",
    step: ctx.state().test?.step ?? 0,
    created_at: new Date().toISOString(),
  });

  const roles: AutoBeAnalyzeRole[] = ctx.state().analyze?.roles ?? [];
  const progress: IProgress = {
    total: roles.length,
    completed: 0,
  };
  const templateFiles = await (await ctx.compiler()).realize.getTemplate();
  const authorizations: AutoBeRealizeAuthorization[] = await Promise.all(
    roles.map((role) =>
      process(
        ctx,
        role,
        InternalFileSystem.DEFAULT.map((el) => ({
          [el]: templateFiles[el],
        })).reduce((acc, cur) => Object.assign(acc, cur), {}),
        progress,
      ),
    ),
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
  role: AutoBeAnalyzeRole,
  templateFiles: Record<string, string>,
  progress: IProgress,
): Promise<AutoBeRealizeAuthorization> {
  const pointer: IPointer<IAutoBeRealizeAuthorizationApplication.IProps | null> =
    {
      value: null,
    };
  const { tokenUsage } = await ctx.conversate({
    source: "realizeAuthorizationWrite",
    histories: transformRealizeAuthorizationHistories(ctx, role),
    controller: createController({
      model: ctx.model,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    message: "Create Authorization Provider and Decorator.",
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

  ctx.dispatch({
    type: "realizeAuthorizationWrite",
    created_at: new Date().toISOString(),
    authorization: authorization,
    tokenUsage,
    completed: ++progress.completed,
    total: progress.total,
    step: ctx.state().test?.step ?? 0,
  } satisfies AutoBeRealizeAuthorizationWriteEvent);
  return orchestrateRealizeAuthorizationCorrect(
    ctx,
    authorization,
    prismaClients,
    templateFiles,
  );
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeRealizeAuthorizationApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;

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
  "claude"
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeRealizeAuthorizationApplication,
    "chatgpt"
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
