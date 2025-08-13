import {
  AutoBeAssistantMessageHistory,
  AutoBeOpenApi,
  AutoBeRealizeAuthorization,
  AutoBeRealizeFunction,
  AutoBeRealizeHistory,
  AutoBeRealizeWriteEvent,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { getAutoBeGenerated } from "../../factory/getAutoBeGenerated";
import { getAutoBeRealizeGenerated } from "../../factory/getAutoBeRealizeGenerated";
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
    const operations: AutoBeOpenApi.IOperation[] | undefined =
      ctx.state().interface?.document.operations;
    if (!operations) {
      throw new Error("Can't do realize agent because operations are nothing.");
    }

    const start: Date = new Date();
    ctx.dispatch({
      type: "realizeStart",
      created_at: start.toISOString(),
      reason: props.reason,
      step: ctx.state().test?.step ?? 0,
    });

    const authorizations: AutoBeRealizeAuthorization[] =
      await orchestrateRealizeAuthorization(ctx);

    const scenarios: IAutoBeRealizeScenarioApplication.IProps[] =
      operations.map((operation) => orchestrateRealizeScenario(ctx, operation));

    const writeProgress = { total: scenarios.length, completed: 0 };
    const writeEvents: AutoBeRealizeWriteEvent[] = await Promise.all(
      scenarios.map(async (scenario) => {
        const code = orchestrateRealizeWrite(
          ctx,
          scenario.decoratorEvent ?? null,
          scenario,
          writeProgress,
        );
        return code;
      }),
    );

    let providers = Object.fromEntries(
      writeEvents.map((event) => [event.location, event.content]),
    );

    let finalCompilationResult = await compile(ctx, {
      authorizations,
      providers,
    });

    if (finalCompilationResult.type !== "success") {
      const MAX_CORRECTION_ATTEMPTS = 3 as const;

      const reviewProgress = {
        total: writeEvents.length,
        completed: writeEvents.length,
      };

      for (let attempt = 0; attempt < MAX_CORRECTION_ATTEMPTS; attempt++) {
        if (finalCompilationResult.result.type === "failure") {
          const failedFiles: Record<string, string> =
            finalCompilationResult.files;

          reviewProgress.total += Object.keys(failedFiles).length;
          const compilationResult: IAutoBeTypeScriptCompileResult.IFailure =
            finalCompilationResult.result;

          await Promise.all(
            Object.entries(failedFiles).map(async ([location, content]) => {
              const diagnostic:
                | IAutoBeTypeScriptCompileResult.IDiagnostic
                | undefined = compilationResult.diagnostics.find(
                (el) => el.file === location,
              );

              const scenario = scenarios.find((el) => el.location === location);
              if (diagnostic && scenario) {
                const correctEvent = await orchestrateRealizeCorrect(
                  ctx,
                  scenario.decoratorEvent ?? null,
                  scenario,
                  content,
                  diagnostic,
                  reviewProgress,
                );

                providers[correctEvent.location] = correctEvent.content;
              }
            }),
          );

          finalCompilationResult = await compile(ctx, {
            authorizations,
            providers,
          });

          if (finalCompilationResult.type === "success") {
            break;
          }
        }
      }
    }

    const functions: AutoBeRealizeFunction[] = Object.entries(providers).map(
      ([location, content]) => {
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
      },
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
      created_at: new Date().toISOString(),
      functions,
      authorizations,
      controllers,
      compiled: await compiler.typescript.compile({
        files: {
          ...(await getAutoBeGenerated(
            compiler,
            ctx.state(),
            ctx.histories(),
            ctx.usage(),
          )),
          ...(await getAutoBeRealizeGenerated({
            document: ctx.state().interface!.document,
            authorizations,
            functions,
            compiler,
          })),
        },
      }),
      step: ctx.state().analyze?.step ?? 0,
      elapsed: new Date().getTime() - start.getTime(),
    });
  };
