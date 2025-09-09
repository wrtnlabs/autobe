import {
  AutoBeAssistantMessageHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeFunction,
  AutoBeRealizeHistory,
  AutoBeRealizeWriteEvent,
  IAutoBeCompiler,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { predicateStateMessage } from "../../utils/predicateStateMessage";
import { orchestrateRealizeAuthorization } from "./orchestrateRealizeAuthorization";
import { orchestrateRealizeCorrect } from "./orchestrateRealizeCorrect";
import { orchestrateRealizeScenario } from "./orchestrateRealizeScenario";
import { orchestrateRealizeWrite } from "./orchestrateRealizeWrite";
import { IAutoBeRealizeScenarioResult } from "./structures/IAutoBeRealizeScenarioResult";

export const orchestrateRealize =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeRealizeHistory> => {
    // PREDICATION
    const operations: AutoBeOpenApi.IOperation[] | undefined =
      ctx.state().interface?.document.operations;
    if (!operations)
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
      reason: props.reason,
      step: ctx.state().test?.step ?? 0,
    });

    // AUTHORIZATIONS
    const authorizations: AutoBeRealizeAuthorization[] =
      await orchestrateRealizeAuthorization(ctx);

    // SCENARIOS
    const scenarios: IAutoBeRealizeScenarioResult[] = operations.map(
      (operation) => {
        const authorization = authorizations.find(
          (el) => el.role.name === operation.authorizationRole,
        );

        return orchestrateRealizeScenario(ctx, operation, authorization);
      },
    );

    const writeProgress: AutoBeProgressEventBase = {
      total: scenarios.length,
      completed: 0,
    };
    const writeEvents: AutoBeRealizeWriteEvent[] = await executeCachedBatch(
      scenarios.map((scenario) => async (promptCacheKey) => {
        const code = await orchestrateRealizeWrite(ctx, {
          totalAuthorizations: authorizations,
          authorization: scenario.decoratorEvent ?? null,
          scenario,
          progress: writeProgress,
          promptCacheKey,
        });
        return code;
      }),
    );

    const functions: AutoBeRealizeFunction[] = Object.entries(
      Object.fromEntries(
        writeEvents.map((event) => [event.location, event.content]),
      ),
    ).map(([location, content]) => {
      const scenario = scenarios.find((el) => el.location === location)!;
      return {
        location,
        content,
        endpoint: {
          method: scenario.operation.method,
          path: scenario.operation.path,
        },
        name: scenario.functionName,
      };
    });

    const reviewProgress = {
      total: writeEvents.length,
      completed: writeEvents.length,
    };

    const result = await orchestrateRealizeCorrect(
      ctx,
      scenarios,
      authorizations,
      functions,
      [],
      reviewProgress,
    );

    const compiler: IAutoBeCompiler = await ctx.compiler();
    const controllers: Record<string, string> =
      await compiler.realize.controller({
        document: ctx.state().interface!.document,
        functions,
        authorizations,
      });

    return ctx.dispatch({
      type: "realizeComplete",
      id: v7(),
      created_at: new Date().toISOString(),
      functions,
      authorizations,
      controllers,
      compiled: result.result,
      step: ctx.state().analyze?.step ?? 0,
      elapsed: new Date().getTime() - start.getTime(),
    });
  };
