import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyze,
  AutoBeEventSource,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeAuthorizationWriteEvent,
  IAutoBeCompiler,
  IAutoBePrismaCompileResult,
} from "@autobe/interface";
import { IPointer, Singleton } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
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

  const actors: AutoBeAnalyze.IActor[] = ctx.state().analyze?.actors ?? [];
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
    actors.map((a) => async (promptCacheKey) => {
      const counter = new Singleton(() => ++progress.completed);
      try {
        return await forceRetry(() =>
          process(ctx, {
            actor: a,
            templates: InternalFileSystem.DEFAULT.map((el) => ({
              [el]: templates[el],
            })).reduce((acc, cur) => Object.assign(acc, cur), {}),
            progress,
            promptCacheKey,
            counter,
          }),
        );
      } catch (error) {
        counter.get();
        throw error;
      }
    }),
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
    actor: AutoBeAnalyze.IActor;
    templates: Record<string, string>;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    counter: Singleton<number>;
  },
): Promise<AutoBeRealizeAuthorization> {
  const preliminary: AutoBePreliminaryController<
    "databaseSchemas" | "complete"
  > = new AutoBePreliminaryController<"databaseSchemas" | "complete">({
    source: SOURCE,
    dispatch: (e) => ctx.dispatch(e),
    application:
      typia.json.application<IAutoBeRealizeAuthorizationWriteApplication>(),
    kinds: ["databaseSchemas", "complete"],
    state: ctx.state(),
  });
  const event: AutoBeRealizeAuthorizationWriteEvent =
    await preliminary.orchestrate(ctx, async (out) => {
      const pointer: IPointer<IAutoBeRealizeAuthorizationWriteApplication.IWrite | null> =
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
      return out(result)({
        type: "realizeAuthorizationWrite",
        id: v7(),
        created_at: new Date().toISOString(),
        authorization: authorization,
        acquisition: preliminary.getAcquisition(),
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        completed: props.counter.get(),
        total: props.progress.total,
        step: ctx.state().test?.step ?? 0,
      } satisfies AutoBeRealizeAuthorizationWriteEvent);
    });
  ctx.dispatch(event);
  const prismaCompiled: IAutoBePrismaCompileResult | undefined =
    ctx.state().database?.compiled;
  const prismaClient: Record<string, string> =
    prismaCompiled?.type === "success" ? prismaCompiled.client : {};
  return await orchestrateRealizeAuthorizationCorrect(ctx, {
    template: props.templates,
    authorization: event.authorization,
    prismaClient,
  });
}

function createController(props: {
  build: (next: IAutoBeRealizeAuthorizationWriteApplication.IWrite) => void;
  preliminary: AutoBePreliminaryController<"databaseSchemas" | "complete">;
}): IAgenticaController.IClass {
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeAuthorizationWriteApplication.IProps> =
      typia.validate<IAutoBeRealizeAuthorizationWriteApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "write")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking,
      request: result.data.request,
    });
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeRealizeAuthorizationWriteApplication>({
      validate: {
        process: validate,
      },
    }),
  );

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "write") props.build(next.request);
      },
    } satisfies IAutoBeRealizeAuthorizationWriteApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeAuthorizationWriteApplication.IProps>;

const SOURCE = "realizeAuthorizationWrite" satisfies AutoBeEventSource;
