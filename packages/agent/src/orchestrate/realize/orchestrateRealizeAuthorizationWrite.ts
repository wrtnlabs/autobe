import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeActor,
  AutoBeEventSource,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeAuthorizationWriteEvent,
  IAutoBeCompiler,
  IAutoBePrismaCompileResult,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformRealizeAuthorizationWriteHistory } from "./histories/transformRealizeAuthorizationWriteHistory";
import { orchestrateRealizeAuthorizationCorrect } from "./orchestrateRealizeAuthorizationCorrect";
import { IAutoBeRealizeAuthorizationWriteApplication } from "./structures/IAutoBeRealizeAuthorizationWriteApplication";
import { AuthorizationFileSystem } from "./utils/AuthorizationFileSystem";
import { InternalFileSystem } from "./utils/InternalFileSystem";

/**
 * 1. Create decorator and its parameters. and design the Authorization Provider.
 * 2. According to Authorization Provider design, create the Provider.
 *
 * @param ctx
 */
export async function orchestrateRealizeAuthorizationWrite(
  ctx: AutoBeContext,
): Promise<AutoBeRealizeAuthorization[]> {
  ctx.dispatch({
    type: "realizeAuthorizationStart",
    id: v7(),
    step: ctx.state().test?.step ?? 0,
    created_at: new Date().toISOString(),
  });

  const actors: AutoBeAnalyzeActor[] = ctx.state().analyze?.actors ?? [];
  const progress: AutoBeProgressEventBase = {
    total: actors.length,
    completed: 0,
  };
  const templates: Record<string, string> = await (
    await ctx.compiler()
  ).getTemplate({
    phase: "realize",
    dbms: "sqlite",
  });
  const authorizations: AutoBeRealizeAuthorization[] = await executeCachedBatch(
    ctx,
    actors.map(
      (a) => (promptCacheKey) =>
        process(ctx, {
          actor: a,
          templates: InternalFileSystem.DEFAULT.map((el) => ({
            [el]: templates[el],
          })).reduce((acc, cur) => Object.assign(acc, cur), {}),
          progress,
          promptCacheKey,
        }),
    ),
  );
  ctx.dispatch({
    type: "realizeAuthorizationComplete",
    id: v7(),
    created_at: new Date().toISOString(),
    step: ctx.state().test?.step ?? 0,
  });
  return authorizations;
}

async function process(
  ctx: AutoBeContext,
  props: {
    actor: AutoBeAnalyzeActor;
    templates: Record<string, string>;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeRealizeAuthorization> {
  const preliminary: AutoBePreliminaryController<"databaseSchemas"> =
    new AutoBePreliminaryController<"databaseSchemas">({
      source: SOURCE,
      application:
        typia.json.application<IAutoBeRealizeAuthorizationWriteApplication>(),
      kinds: ["databaseSchemas"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeRealizeAuthorizationWriteApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: "realizeAuthorizationWrite",
      controller: createController({
        build: (next) => {
          pointer.value = next;
        },
        preliminary,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformRealizeAuthorizationWriteHistory({
        actor: props.actor,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const compiler: IAutoBeCompiler = await ctx.compiler();
    const authorization: AutoBeRealizeAuthorization = {
      actor: props.actor,
      decorator: {
        location: AuthorizationFileSystem.decoratorPath(
          pointer.value.decorator.name,
        ),
        name: pointer.value.decorator.name,
        content: pointer.value.decorator.content,
      },
      payload: {
        location: AuthorizationFileSystem.payloadPath(
          pointer.value.payload.name,
        ),
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
    ctx.dispatch({
      type: "realizeAuthorizationWrite",
      id: v7(),
      created_at: new Date().toISOString(),
      authorization: authorization,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      completed: ++props.progress.completed,
      total: props.progress.total,
      step: ctx.state().test?.step ?? 0,
    } satisfies AutoBeRealizeAuthorizationWriteEvent);

    const prismaCompiled: IAutoBePrismaCompileResult | undefined =
      ctx.state().database?.compiled;
    const prismaClient: Record<string, string> =
      prismaCompiled?.type === "success" ? prismaCompiled.client : {};
    return out(result)(
      await orchestrateRealizeAuthorizationCorrect(ctx, {
        template: props.templates,
        authorization,
        prismaClient,
      }),
    );
  });
}

function createController(props: {
  build: (next: IAutoBeRealizeAuthorizationWriteApplication.IComplete) => void;
  preliminary: AutoBePreliminaryController<"databaseSchemas">;
}): IAgenticaController.IClass {
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeAuthorizationWriteApplication.IProps> =
      typia.validate<IAutoBeRealizeAuthorizationWriteApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "complete")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking,
      request: result.data.request,
    });
  };

  const application: ILlmApplication =
    typia.llm.application<IAutoBeRealizeAuthorizationWriteApplication>({
      validate: {
        process: validate,
      },
    });

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBeRealizeAuthorizationWriteApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeAuthorizationWriteApplication.IProps>;

const SOURCE = "realizeAuthorizationWrite" satisfies AutoBeEventSource;
