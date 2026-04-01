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
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
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
    actors.map(
      (a) => (promptCacheKey) =>
        forceRetry(() =>
          process(ctx, {
            actor: a,
            templates: InternalFileSystem.DEFAULT.map((el) => ({
              [el]: templates[el],
            })).reduce((acc, cur) => Object.assign(acc, cur), {}),
            progress,
            promptCacheKey,
          }),
        ),
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
    actor: AutoBeAnalyze.IActor;
    templates: Record<string, string>;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeRealizeAuthorization> {
  const compiler: IAutoBeCompiler = await ctx.compiler();
  let previousWrite: IAutoBeRealizeAuthorizationWriteApplication.IWrite | null =
    null;

  const cyclinic = new AutoBeCyclinicController<"databaseSchemas">({
    source: SOURCE,
    application:
      typia.json.application<IAutoBeRealizeAuthorizationWriteApplication>(),
    kinds: ["databaseSchemas"],
    state: ctx.state(),
  });

  return cyclinic.orchestrate(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeRealizeAuthorizationWriteApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({ cyclinic, action }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...transformRealizeAuthorizationWriteHistory({
          actor: props.actor,
          preliminary: context.preliminary,
          previousWrite,
        }),
      });

      return { result, action: action.value };
    },
    // VALIDATE: write phase has no external compilation — always succeeds
    async (writeData) => {
      previousWrite = writeData;
      return { success: true };
    },
    // FINALIZE: build authorization, dispatch event, run correction loop
    async (lastWrite, result) => {
      const authorization: AutoBeRealizeAuthorization = {
        actor: props.actor,
        decorator: {
          location: AuthorizationFileSystem.decoratorPath(
            lastWrite.decorator.name,
          ),
          name: lastWrite.decorator.name,
          content: lastWrite.decorator.content,
        },
        payload: {
          location: AuthorizationFileSystem.payloadPath(
            lastWrite.payload.name,
          ),
          name: lastWrite.payload.name,
          content: await compiler.typescript.beautify(
            lastWrite.payload.content,
          ),
        },
        provider: {
          location: AuthorizationFileSystem.providerPath(
            lastWrite.provider.name,
          ),
          name: lastWrite.provider.name,
          content: lastWrite.provider.content,
        },
      };

      if (result !== null)
        ctx.dispatch({
          type: "realizeAuthorizationWrite",
          id: v7(),
          created_at: new Date().toISOString(),
          authorization,
          acquisition: cyclinic.getPreliminary().getAcquisition(),
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

      return orchestrateRealizeAuthorizationCorrect(ctx, {
        template: props.templates,
        authorization,
        prismaClient,
      });
    },
  );
}

function createController(props: {
  cyclinic: AutoBeCyclinicController<"databaseSchemas">;
  action: IPointer<
    | {
        type: "write";
        data: IAutoBeRealizeAuthorizationWriteApplication.IWrite;
      }
    | { type: "complete" }
    | null
  >;
}): IAgenticaController.IClass {
  const preliminary: AutoBePreliminaryController<"databaseSchemas"> =
    props.cyclinic.getPreliminary();
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeAuthorizationWriteApplication.IProps> =
      typia.validate<IAutoBeRealizeAuthorizationWriteApplication.IProps>(input);
    if (result.success === false) return result;
    const req = result.data.request;
    if (req.type === "write" || req.type === "complete") return result;
    return preliminary.validate({
      thinking: result.data.thinking,
      request: req,
    });
  };

  const application: ILlmApplication = props.cyclinic.fixCompleteAvailability(
    preliminary.fixApplication(
      typia.llm.application<IAutoBeRealizeAuthorizationWriteApplication>({
        validate: {
          process: validate,
        },
      }),
    ),
  );

  return {
    protocol: "class",
    name: SOURCE satisfies AutoBeEventSource,
    application,
    execute: {
      process: (input) => {
        if (input.request.type === "write")
          props.action.value = { type: "write", data: input.request };
        else if (input.request.type === "complete")
          props.action.value = { type: "complete" };
      },
    } satisfies IAutoBeRealizeAuthorizationWriteApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeAuthorizationWriteApplication.IProps>;

const SOURCE = "realizeAuthorizationWrite" satisfies AutoBeEventSource;
