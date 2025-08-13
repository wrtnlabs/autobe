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

    // generate authorizations and functions

    const authorizations: AutoBeRealizeAuthorization[] =
      await orchestrateRealizeAuthorization(ctx);

    const scenarios: IAutoBeRealizeScenarioApplication.IProps[] =
      operations.map((operation) => orchestrateRealizeScenario(ctx, operation));

    const writeProgress = { total: scenarios.length, completed: 0 } as const;
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

    const reviewProgress = { total: writeEvents.length, completed: 0 };

    // Initialize providers from write events
    let providers = Object.fromEntries(
      writeEvents.map((event) => [event.location, event.content]),
    );

    // Compilation result holder

    // Retry compilation with review on failures
    for (let attempt = 0; attempt < 3; attempt++) {
      const compilation = await compile(ctx, {
        authorizations,
        providers,
      });

      // Success case - exit the loop
      if (compilation.type === "success") {
        break;
      }

      // Failure case - prepare for review
      if (compilation.result.type === "failure") {
        const failedFiles = compilation.files;

        const compilationResult: IAutoBeTypeScriptCompileResult.IFailure =
          compilation.result;

        await Promise.all(
          Object.entries(failedFiles).map(async ([location, content]) => {
            ++reviewProgress.total;

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

    // compile controllers
    const compiler: IAutoBeCompiler = await ctx.compiler();
    const controllers: Record<string, string> =
      await compiler.realize.controller({
        document: ctx.state().interface!.document,
        functions,
        authorizations,
      });

    // report
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
