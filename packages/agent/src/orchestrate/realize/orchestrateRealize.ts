import {
  AutoBeAssistantMessageHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeCollectorPlan,
  AutoBeRealizeHistory,
  AutoBeRealizeOperationFunction,
  AutoBeRealizeTransformerFunction,
  AutoBeRealizeTransformerPlan,
  IAutoBeCompiler,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { predicateStateMessage } from "../../utils/predicateStateMessage";
import { IAutoBeFacadeApplicationProps } from "../facade/histories/IAutoBeFacadeApplicationProps";
import { orchestrateRealizeAuthorizationWrite } from "./orchestrateRealizeAuthorizationWrite";
import { orchestrateRealizeCollectorPlan } from "./orchestrateRealizeCollectorPlan";
import { orchestrateRealizeCollectorWrite } from "./orchestrateRealizeCollectorWrite";
import { orchestrateRealizeOperationWrite } from "./orchestrateRealizeOperationWrite";
import { orchestrateRealizeTransformerPlan } from "./orchestrateRealizeTransformerPlan";
import { orchestrateRealizeTransformerWrite } from "./orchestrateRealizeTransformerWrite";
import { AutoBeRealizeCollectorProgrammer } from "./programmers/AutoBeRealizeCollectorProgrammer";
import { AutoBeRealizeTransformerProgrammer } from "./programmers/AutoBeRealizeTransformerProgrammer";

export const orchestrateRealize =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeFacadeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeRealizeHistory> => {
    // PREDICATION
    const document: AutoBeOpenApi.IDocument | undefined =
      ctx.state().interface?.document;
    if (document === undefined)
      throw new Error("Can't do realize agent because operations are nothing.");

    const start: Date = new Date();
    const predicate: string | null = predicateStateMessage(
      ctx.state(),
      "realize",
    );
    if (predicate !== null)
      return ctx.assistantMessage({
        type: "assistantMessage",
        id: v7(),
        created_at: start.toISOString(),
        text: predicate,
        completed_at: new Date().toISOString(),
      });
    ctx.dispatch({
      type: "realizeStart",
      id: v7(),
      created_at: start.toISOString(),
      reason: props.instruction,
      step: ctx.state().test?.step ?? 0,
    });

    // PREPARE ASSETS
    const planProgress: AutoBeProgressEventBase = {
      completed: 0,
      total:
        Object.keys(document.components.schemas).filter(
          AutoBeRealizeCollectorProgrammer.filter,
        ).length +
        Object.keys(document.components.schemas).filter(
          AutoBeRealizeTransformerProgrammer.filter,
        ).length,
    };
    const writeProgress: AutoBeProgressEventBase = {
      completed: 0,
      total: document.operations.length,
    };

    const compiler: IAutoBeCompiler = await ctx.compiler();
    const authorizations: AutoBeRealizeAuthorization[] =
      await orchestrateRealizeAuthorizationWrite(ctx);
    const collectors: AutoBeRealizeCollectorFunction[] = await getCollectors(
      ctx,
      {
        planProgress,
        writeProgress,
      },
    );
    const transformers: AutoBeRealizeTransformerFunction[] =
      await getTransformers(ctx, {
        planProgress,
        writeProgress,
      });

    const operations: AutoBeRealizeOperationFunction[] =
      await orchestrateRealizeOperationWrite(ctx, {
        authorizations,
        collectors,
        transformers,
        progress: writeProgress,
      });

    const controllers: Record<string, string> =
      await compiler.realize.controller({
        document: ctx.state().interface!.document,
        functions: operations,
        authorizations,
      });
    return ctx.dispatch({
      type: "realizeComplete",
      id: v7(),
      functions: [...collectors, ...transformers, ...operations],
      authorizations,
      controllers,
      compiled: {
        type: "success", // @todo fake
      },
      aggregates: ctx.getCurrentAggregates("realize"),
      step: ctx.state().analyze?.step ?? 0,
      elapsed: new Date().getTime() - start.getTime(),
      created_at: new Date().toISOString(),
    });
  };

async function getCollectors(
  ctx: AutoBeContext<any>,
  props: {
    planProgress: AutoBeProgressEventBase;
    writeProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCollectorFunction[]> {
  const plans: AutoBeRealizeCollectorPlan[] =
    await orchestrateRealizeCollectorPlan(ctx, {
      progress: props.planProgress,
    });
  return await orchestrateRealizeCollectorWrite(ctx, {
    plans,
    progress: props.writeProgress,
  });
}

async function getTransformers(
  ctx: AutoBeContext<any>,
  props: {
    planProgress: AutoBeProgressEventBase;
    writeProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeTransformerFunction[]> {
  const plans: AutoBeRealizeTransformerPlan[] =
    await orchestrateRealizeTransformerPlan(ctx, {
      progress: props.planProgress,
    });
  return await orchestrateRealizeTransformerWrite(ctx, {
    plans,
    progress: props.writeProgress,
  });
}
