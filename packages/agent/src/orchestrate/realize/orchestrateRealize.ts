import {
  AutoBeAssistantMessageHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeFunction,
  AutoBeRealizeHistory,
  AutoBeRealizeValidateEvent,
  AutoBeRealizeWriteEvent,
  IAutoBeCompiler,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { predicateStateMessage } from "../../utils/predicateStateMessage";
import { IAutoBeFacadeApplicationProps } from "../facade/histories/IAutoBeFacadeApplicationProps";
import { compileRealizeFiles } from "./internal/compileRealizeFiles";
import { orchestrateRealizeAuthorizationWrite } from "./orchestrateRealizeAuthorizationWrite";
import { orchestrateRealizeCorrect } from "./orchestrateRealizeCorrect";
import { orchestrateRealizeCorrectCasting } from "./orchestrateRealizeCorrectCasting";
import { orchestrateRealizeWrite } from "./orchestrateRealizeWrite";
import { IAutoBeRealizeScenarioResult } from "./structures/IAutoBeRealizeScenarioResult";
import { generateRealizeScenario } from "./utils/generateRealizeScenario";

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
    const compiler: IAutoBeCompiler = await ctx.compiler();
    const authorizations: AutoBeRealizeAuthorization[] =
      await orchestrateRealizeAuthorizationWrite(ctx);

    const writeProgress: AutoBeProgressEventBase = {
      total: document.operations.length,
      completed: 0,
    };
    const correctProgress: AutoBeProgressEventBase = {
      total: document.operations.length,
      completed: 0,
    };

    const process = async (
      artifacts: IAutoBeRealizeScenarioResult[],
    ): Promise<IBucket> => {
      const writes: AutoBeRealizeWriteEvent[] = (
        await executeCachedBatch(
          ctx,
          artifacts.map((art) => async (promptCacheKey) => {
            const write = async (): Promise<AutoBeRealizeWriteEvent | null> => {
              try {
                return await orchestrateRealizeWrite(ctx, {
                  totalAuthorizations: authorizations,
                  authorization: art.decoratorEvent ?? null,
                  scenario: art,
                  document,
                  progress: writeProgress,
                  promptCacheKey,
                });
              } catch {
                return null;
              }
            };
            return (await write()) ?? (await write());
          }),
        )
      ).filter((w) => w !== null);
      const functions: AutoBeRealizeFunction[] = Object.entries(
        Object.fromEntries(writes.map((w) => [w.location, w.content])),
      ).map(([location, content]) => {
        const scenario: IAutoBeRealizeScenarioResult = artifacts.find(
          (el) => el.location === location,
        )!;
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
      const corrected: AutoBeRealizeFunction[] =
        await orchestrateRealizeCorrectCasting(
          ctx,
          artifacts,
          authorizations,
          functions,
          correctProgress,
        ).then(async (res) => {
          return await orchestrateRealizeCorrect(
            ctx,
            artifacts,
            authorizations,
            res,
            [],
            correctProgress,
          );
        });
      const validate: AutoBeRealizeValidateEvent = await compileRealizeFiles(
        ctx,
        {
          authorizations,
          functions: corrected,
        },
      );
      return {
        corrected,
        validate,
      };
    };

    // SCENARIOS
    const entireScenarios: IAutoBeRealizeScenarioResult[] =
      document.operations.map((operation) =>
        generateRealizeScenario(operation, authorizations),
      );
    let bucket: IBucket = await process(entireScenarios);
    for (let i: number = 0; i < 2; ++i) {
      if (bucket.validate.result.type !== "failure") break;

      const failedScenarios: IAutoBeRealizeScenarioResult[] = Array.from(
        new Set(bucket.validate.result.diagnostics.map((f) => f.file)),
      )
        .map((location) =>
          bucket.corrected.find((f) => f.location === location),
        )
        .filter((f) => f !== undefined)
        .map((f) =>
          entireScenarios.find(
            (s) =>
              s.operation.path === f.endpoint.path &&
              s.operation.method === f.endpoint.method,
          ),
        )
        .filter((o) => o !== undefined);
      if (failedScenarios.length === 0) break;

      writeProgress.total += failedScenarios.length;
      correctProgress.total += failedScenarios.length;

      const newBucket: IBucket = await process(failedScenarios);
      const corrected: Map<string, AutoBeRealizeFunction> = new Map([
        ...bucket.corrected.map((f) => [f.location, f] as const),
        ...newBucket.corrected.map((f) => [f.location, f] as const),
      ]);
      bucket = {
        corrected: Array.from(corrected.values()),
        validate: newBucket.validate,
      };
    }

    const controllers: Record<string, string> =
      await compiler.realize.controller({
        document: ctx.state().interface!.document,
        functions: bucket.corrected,
        authorizations,
      });
    return ctx.dispatch({
      type: "realizeComplete",
      id: v7(),
      functions: bucket.corrected,
      authorizations,
      controllers,
      compiled: bucket.validate.result,
      aggregates: ctx.getCurrentAggregates("realize"),
      step: ctx.state().analyze?.step ?? 0,
      elapsed: new Date().getTime() - start.getTime(),
      created_at: new Date().toISOString(),
    });
  };

interface IBucket {
  corrected: AutoBeRealizeFunction[];
  validate: AutoBeRealizeValidateEvent;
}
