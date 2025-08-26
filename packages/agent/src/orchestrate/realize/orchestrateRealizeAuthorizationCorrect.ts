import { IAgenticaController } from "@agentica/core";
import {
  AutoBeRealizeAuthorization,
  AutoBeRealizeAuthorizationCorrect,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformRealizeAuthorizationCorrectHistories } from "./histories/transformRealizeAuthorizationCorrectHistories";
import { IAutoBeRealizeAuthorizationCorrectApplication } from "./structures/IAutoBeRealizeAuthorizationCorrectApplication";
import { AuthorizationFileSystem } from "./utils/AuthorizationFileSystem";
import { AutoBeRealizeAuthorizationReplaceImport } from "./utils/AutoBeRealizeAuthorizationReplaceImport";

export async function orchestrateRealizeAuthorizationCorrect<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  authorization: AutoBeRealizeAuthorization,
  prismaClients: Record<string, string>,
  templateFiles: Record<string, string>,
  life: number = 4,
): Promise<AutoBeRealizeAuthorization> {
  const compiler: IAutoBeCompiler = await ctx.compiler();
  const providerContent: string = await compiler.typescript.beautify(
    AutoBeRealizeAuthorizationReplaceImport.replaceProviderImport(
      authorization.role.name,
      authorization.provider.content,
    ),
  );
  const decoratorContent: string = await compiler.typescript.beautify(
    AutoBeRealizeAuthorizationReplaceImport.replaceDecoratorImport(
      authorization.role.name,
      authorization.decorator.content,
    ),
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

  const compiled: IAutoBeTypeScriptCompileResult =
    await compiler.typescript.compile({
      files,
    });

  ctx.dispatch({
    type: "realizeAuthorizationValidate",
    id: v7(),
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
  const { tokenUsage } = await ctx.conversate({
    source: "realizeAuthorizationCorrect",
    histories: transformRealizeAuthorizationCorrectHistories(
      ctx,
      authorization,
      templateFiles,
      compiled.diagnostics,
    ),
    controller: createController({
      model: ctx.model,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    message: "Please correct the decorator and the provider.",
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
      name: pointer.value.payload.name,
      location: AuthorizationFileSystem.payloadPath(pointer.value.payload.name),
      content: await compiler.typescript.beautify(
        pointer.value.payload.content,
      ),
    },
    role: authorization.role,
  };

  ctx.dispatch({
    ...pointer.value,
    type: "realizeAuthorizationCorrect",
    id: v7(),
    created_at: new Date().toISOString(),
    authorization: result,
    result: compiled,
    tokenUsage,
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

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeRealizeAuthorizationCorrectApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
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
  "claude"
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeRealizeAuthorizationCorrectApplication,
    "chatgpt"
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
