import { IAgenticaController, MicroAgentica } from "@agentica/core";
import {
  AutoBeRealizeAuthorization,
  AutoBeRealizeAuthorizationCorrect,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { AutoBeRealizeAuthorizationReplaceImport } from "@autobe/utils";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { IAutoBeRealizeAuthorizationCorrectApplication } from "./structures/IAutoBeRealizeAuthorizationCorrectApplication";
import { transformRealizeAuthorizationCorrectHistories } from "./transformRealizeAuthorizationCorrectHistories";
import { AuthorizationFileSystem } from "./utils/AuthorizationFileSystem";

export async function orchestrateRealizeAuthorizationCorrect<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  authorization: AutoBeRealizeAuthorization,
  prismaClients: Record<string, string>,
  templateFiles: Record<string, string>,
  life: number = 4,
): Promise<AutoBeRealizeAuthorization> {
  const providerContent =
    AutoBeRealizeAuthorizationReplaceImport.replaceProviderImport(
      authorization.role,
      authorization.provider.content,
    );

  const decoratorContent =
    AutoBeRealizeAuthorizationReplaceImport.replaceDecoratorImport(
      authorization.role,
      authorization.decorator.content,
    );

  // Check Compile
  const files: Record<string, string> = {
    ...templateFiles,
    ...prismaClients,
    [AuthorizationFileSystem.decoratorPath(authorization.decorator.name)]:
      decoratorContent,
    [AuthorizationFileSystem.providerPath(authorization.provider.name)]:
      providerContent,
    [AuthorizationFileSystem.payloadPath(authorization.payload.name)]:
      authorization.payload.content,
  };

  const compiler: IAutoBeCompiler = await ctx.compiler();

  const compiled: IAutoBeTypeScriptCompileResult =
    await compiler.typescript.compile({
      files,
    });

  ctx.dispatch({
    type: "realizeAuthorizationValidate",
    created_at: new Date().toISOString(),
    authorization: authorization,
    result: compiled,
    step: ctx.state().test?.step ?? 0,
  });

  if (compiled.type === "success") {
    return authorization;
  } else if (compiled.type === "exception" || life === 0) {
    return authorization;
  }

  const pointer: IPointer<IAutoBeRealizeAuthorizationCorrectApplication.IProps | null> =
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
      authorization,
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

  const result: AutoBeRealizeAuthorizationCorrect = {
    ...pointer.value,
    decorator: {
      ...pointer.value.decorator,
      location: AuthorizationFileSystem.decoratorPath(
        pointer.value.decorator.name,
      ),
    },
    provider: {
      ...pointer.value.provider,
      location: AuthorizationFileSystem.providerPath(
        pointer.value.provider.name,
      ),
    },
    payload: {
      ...pointer.value.payload,
      location: AuthorizationFileSystem.payloadPath(pointer.value.payload.name),
    },
    role: authorization.role,
  };

  ctx.dispatch({
    ...pointer.value,
    type: "realizeAuthorizationCorrect",
    created_at: new Date().toISOString(),
    authorization: result,
    result: compiled,
    step: ctx.state().test?.step ?? 0,
  });

  return await orchestrateRealizeAuthorizationCorrect(
    ctx,
    result,
    prismaClients,
    templateFiles,
    life - 1,
  );
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeRealizeAuthorizationCorrectApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;

  return {
    protocol: "class",
    name: "Correct Authorization",
    application,
    execute: {
      correctDecorator: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeRealizeAuthorizationCorrectApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeRealizeAuthorizationCorrectApplication,
  "claude",
  {
    reference: true;
  }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeRealizeAuthorizationCorrectApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
