import {
  AutoBeAssistantMessageHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeFunction,
  AutoBeRealizeHistory,
  AutoBeRealizeWriteEvent,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { predicateStateMessage } from "../../utils/predicateStateMessage";
import { compile } from "./internal/compile";
import { orchestrateRealizeAuthorization } from "./orchestrateRealizeAuthorization";
import { orchestrateRealizeCorrect } from "./orchestrateRealizeCorrect";
import { orchestrateRealizeScenario } from "./orchestrateRealizeScenario";
import { orchestrateRealizeWrite } from "./orchestrateRealizeWrite";
import { IAutoBeRealizeScenarioApplication } from "./structures/IAutoBeRealizeScenarioApplication";

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
    const scenarios: IAutoBeRealizeScenarioApplication.IProps[] =
      operations.map((operation) => {
        const authorization = authorizations.find(
          (el) => el.role.name === operation.authorizationRole,
        );

        return orchestrateRealizeScenario(ctx, operation, authorization);
      });

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

    let compilation = await compile(ctx, { authorizations, functions });

    if (compilation.type !== "success") {
      const MAX_CORRECTION_ATTEMPTS = 5 as const;

      const reviewProgress = {
        id: v7(),
        total: writeEvents.length,
        completed: writeEvents.length,
      };

      for (let attempt = 0; attempt < MAX_CORRECTION_ATTEMPTS; attempt++) {
        if (compilation.type === "failure") {
          const failedFiles: Record<string, string> = Object.fromEntries(
            compilation.type === "failure"
              ? compilation.diagnostics.map((d) => [d.file, d.code])
              : [],
          );

          reviewProgress.total += Object.keys(failedFiles).length;
          const failure: IAutoBeTypeScriptCompileResult.IFailure = compilation;

          await executeCachedBatch(
            Object.entries(failedFiles).map(
              ([location, content]) =>
                async () => {
                  const diagnostic:
                    | IAutoBeTypeScriptCompileResult.IDiagnostic
                    | undefined = failure.diagnostics.find(
                    (el) => el.file === location,
                  );

                  const scenario = scenarios.find(
                    (el) => el.location === location,
                  );
                  if (diagnostic && scenario) {
                    const correctEvent = await orchestrateRealizeCorrect(ctx, {
                      totalAuthorizations: authorizations,
                      authorization: scenario.decoratorEvent ?? null,
                      scenario,
                      code: content,
                      diagnostic,
                      progress: reviewProgress,
                    });

                    const corrected = functions.find(
                      (el) => el.location === correctEvent.location,
                    );

                    if (corrected) {
                      corrected.content = correctEvent.content;
                    }
                  }
                },
            ),
          );

          compilation = await compile(ctx, { authorizations, functions });
          if (compilation.type === "success") {
            break;
          }
        }
      }
    }

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
      compiled: await compile(ctx, { authorizations, functions }),
      step: ctx.state().analyze?.step ?? 0,
      elapsed: new Date().getTime() - start.getTime(),
    });
  };
