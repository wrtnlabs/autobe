import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeRealizeAuthorization,
  AutoBeRealizeAuthorizationCorrect,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformRealizeAuthorizationCorrectHistory } from "./histories/transformRealizeAuthorizationCorrectHistory";
import { IAutoBeRealizeAuthorizationCorrectApplication } from "./structures/IAutoBeRealizeAuthorizationCorrectApplication";
import { AuthorizationFileSystem } from "./utils/AuthorizationFileSystem";
import { AutoBeRealizeAuthorizationReplaceImport } from "./utils/AutoBeRealizeAuthorizationReplaceImport";

export async function orchestrateRealizeAuthorizationCorrect<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    authorization: AutoBeRealizeAuthorization;
    template: Record<string, string>;
    prismaClient: Record<string, string>;
  },
  life: number = ctx.retry,
): Promise<AutoBeRealizeAuthorization> {
  const compiler: IAutoBeCompiler = await ctx.compiler();
  const providerContent: string = await compiler.typescript.beautify(
    AutoBeRealizeAuthorizationReplaceImport.replaceProviderImport(
      props.authorization.actor.name,
      props.authorization.provider.content,
    ),
  );
  const decoratorContent: string = await compiler.typescript.beautify(
    AutoBeRealizeAuthorizationReplaceImport.replaceDecoratorImport(
      props.authorization.actor.name,
      props.authorization.decorator.content,
    ),
  );

  // Check Compile
  const files: Record<string, string> = {
    ...props.template,
    ...props.prismaClient,
    [AuthorizationFileSystem.decoratorPath(props.authorization.decorator.name)]:
      decoratorContent,
    [AuthorizationFileSystem.providerPath(props.authorization.provider.name)]:
      providerContent,
    [AuthorizationFileSystem.payloadPath(props.authorization.payload.name)]:
      props.authorization.payload.content,
  };

  const compiled: IAutoBeTypeScriptCompileResult =
    await compiler.typescript.compile({
      files,
    });

  ctx.dispatch({
    type: "realizeAuthorizationValidate",
    id: v7(),
    created_at: new Date().toISOString(),
    authorization: props.authorization,
    result: compiled,
    step: ctx.state().test?.step ?? 0,
  });

  if (compiled.type === "success") {
    return props.authorization;
  } else if (compiled.type === "exception" || life < 0) {
    return props.authorization;
  }

  const preliminary: AutoBePreliminaryController<"prismaSchemas"> =
    new AutoBePreliminaryController({
      source: SOURCE,
      application:
        typia.json.application<IAutoBeRealizeAuthorizationCorrectApplication>(),
      kinds: ["prismaSchemas"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeRealizeAuthorizationCorrectApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: "realizeAuthorizationCorrect",
      controller: createController({
        model: ctx.model,
        build: (next) => {
          pointer.value = next;
        },
        preliminary,
      }),
      enforceFunctionCall: true,
      ...transformRealizeAuthorizationCorrectHistory({
        authorization: props.authorization,
        template: props.template,
        diagnostics: compiled.diagnostics,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const correct: AutoBeRealizeAuthorizationCorrect = {
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
        location: AuthorizationFileSystem.payloadPath(
          pointer.value.payload.name,
        ),
        content: await compiler.typescript.beautify(
          pointer.value.payload.content,
        ),
      },
      actor: props.authorization.actor,
    };

    ctx.dispatch({
      ...pointer.value,
      type: "realizeAuthorizationCorrect",
      id: v7(),
      created_at: new Date().toISOString(),
      authorization: correct,
      result: compiled,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      step: ctx.state().test?.step ?? 0,
    });
    return out(result)(
      await orchestrateRealizeAuthorizationCorrect(
        ctx,
        {
          authorization: correct,
          prismaClient: props.prismaClient,
          template: props.template,
        },
        life - 1,
      ),
    );
  });
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (
    next: IAutoBeRealizeAuthorizationCorrectApplication.IComplete,
  ) => void;
  preliminary: AutoBePreliminaryController<"prismaSchemas">;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeAuthorizationCorrectApplication.IProps> =
      typia.validate<IAutoBeRealizeAuthorizationCorrectApplication.IProps>(
        input,
      );
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
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBeRealizeAuthorizationCorrectApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<
      IAutoBeRealizeAuthorizationCorrectApplication,
      "chatgpt"
    >({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<
      IAutoBeRealizeAuthorizationCorrectApplication,
      "claude"
    >({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<
      IAutoBeRealizeAuthorizationCorrectApplication,
      "gemini"
    >({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeAuthorizationCorrectApplication.IProps>;

const SOURCE = "realizeAuthorizationCorrect" satisfies AutoBeEventSource;
