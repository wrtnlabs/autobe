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
import { compileRealizeFiles } from "./internal/compileRealizeFiles";
import { orchestrateRealizeCorrectCasting } from "./orchestRateRealizeCorrectCasting";
import { orchestrateRealizeAuthorization } from "./orchestrateRealizeAuthorization";
import { orchestrateRealizeCorrect } from "./orchestrateRealizeCorrect";
import { orchestrateRealizeCorrectDate } from "./orchestrateRealizeCorrectDate";
import { orchestrateRealizeWrite } from "./orchestrateRealizeWrite";
import { IAutoBeRealizeFunctionFailure } from "./structures/IAutoBeRealizeFunctionFailure";
import { IAutoBeRealizeScenarioResult } from "./structures/IAutoBeRealizeScenarioResult";
import { generateRealizeScenario } from "./utils/generateRealizeScenario";

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
      (operation) => generateRealizeScenario(ctx, operation, authorizations),
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

    const converted: AutoBeRealizeFunction[] =
      await orchestrateRealizeCorrectCasting(
        ctx,
        authorizations,
        functions,
        reviewProgress,
        parseInt((ctx.retry / 2).toString()),
      );

    const correctedDate: AutoBeRealizeFunction[] =
      await orchestrateRealizeCorrectDate(
        ctx,
        authorizations,
        converted,
        reviewProgress,
        parseInt((ctx.retry / 2).toString()),
      );

    const totalCorrected: AutoBeRealizeFunction[] =
      await orchestrateRealizeCorrect(
        ctx,
        scenarios,
        authorizations,
        correctedDate,
        [] satisfies IAutoBeRealizeFunctionFailure[],
        reviewProgress,
      );

    const compiler: IAutoBeCompiler = await ctx.compiler();
    const controllers: Record<string, string> =
      await compiler.realize.controller({
        document: ctx.state().interface!.document,
        functions: totalCorrected,
        authorizations,
      });

    const { result } = await compileRealizeFiles(ctx, {
      authorizations,
      functions: totalCorrected,
    });

    return ctx.dispatch({
      type: "realizeComplete",
      id: v7(),
      created_at: new Date().toISOString(),
      functions,
      authorizations,
      controllers,
      compiled: result,
      step: ctx.state().analyze?.step ?? 0,
      elapsed: new Date().getTime() - start.getTime(),
    });
  };
