import {
  AutoBeAssistantMessageHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeHistory,
  AutoBeRealizeOperationFunction,
  AutoBeRealizeTransformerFunction,
  IAutoBeCompiler,
} from "@autobe/interface";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { predicateStateMessage } from "../../utils/predicateStateMessage";
import { IAutoBeFacadeApplicationProps } from "../facade/histories/IAutoBeFacadeApplicationProps";
import { orchestrateRealizeAuthorizationWrite } from "./orchestrateRealizeAuthorizationWrite";
import { orchestrateRealizeCollector } from "./orchestrateRealizeCollector";
import { orchestrateRealizeOperation } from "./orchestrateRealizeOperation";
import { orchestrateRealizeTransformer } from "./orchestrateRealizeTransformer";
import { AutoBeRealizeCollectorProgrammer } from "./programmers/AutoBeRealizeCollectorProgrammer";
import { AutoBeRealizeTransformerProgrammer } from "./programmers/AutoBeRealizeTransformerProgrammer";

export const orchestrateRealize =
  (ctx: AutoBeContext) =>
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
        Object.keys(document.components.schemas).filter((key) =>
          AutoBeRealizeTransformerProgrammer.filter({
            schemas: document.components.schemas,
            key,
          }),
        ).length,
    };
    const writeProgress: AutoBeProgressEventBase = {
      completed: 0,
      total: document.operations.length,
    };
    const correctProgress: AutoBeProgressEventBase = {
      completed: 0,
      total: 0,
    };

    const authorizations: AutoBeRealizeAuthorization[] =
      await orchestrateRealizeAuthorizationWrite(ctx);
    const collectors: AutoBeRealizeCollectorFunction[] =
      await orchestrateRealizeCollector(ctx, {
        planProgress,
        writeProgress,
        correctProgress,
      });
    const transformers: AutoBeRealizeTransformerFunction[] =
      await orchestrateRealizeTransformer(ctx, {
        planProgress,
        writeProgress,
        correctProgress,
      });
    const operations: AutoBeRealizeOperationFunction[] =
      await orchestrateRealizeOperation(ctx, {
        authorizations,
        collectors,
        transformers,
        writeProgress,
        correctProgress,
      });

    const compiler: IAutoBeCompiler = await ctx.compiler();
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
