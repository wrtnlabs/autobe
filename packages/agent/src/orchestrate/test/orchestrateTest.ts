import {
  AutoBeAssistantMessageHistory,
  AutoBeOpenApi,
  AutoBeTestHistory,
  AutoBeTestScenario,
  AutoBeTestValidateEvent,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { predicateStateMessage } from "../../utils/predicateStateMessage";
import { IAutoBeFacadeApplicationProps } from "../facade/histories/IAutoBeFacadeApplicationProps";
import { orchestrateTestCorrect } from "./orchestrateTestCorrect";
import { orchestrateTestScenario } from "./orchestrateTestScenario";
import { orchestrateTestWrite } from "./orchestrateTestWrite";
import { orchestrateTestWriteAuthorization } from "./orchestrateTestWriteAuthorization";
import { orchestrateTestWriteGeneration } from "./orchestrateTestWriteGeneration";
import { orchestrateTestWritePrepare } from "./orchestrateTestWritePrepare";
import { IAutoBeTestAuthorizationWriteResult } from "./structures/IAutoBeTestAuthorizationWriteResult";
import { IAutoBeTestGenerationWriteResult } from "./structures/IAutoBeTestGenerationWriteResult";
import { IAutoBeTestPrepareWriteResult } from "./structures/IAutoBeTestPrepareWriteResult";
import { IAutoBeTestWriteResult } from "./structures/IAutoBeTestWriteResult";

export const orchestrateTest =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeFacadeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeTestHistory> => {
    // PREDICATION
    const start: Date = new Date();
    const predicate: string | null = predicateStateMessage(ctx.state(), "test");
    if (predicate !== null)
      return ctx.assistantMessage({
        type: "assistantMessage",
        id: v7(),
        created_at: start.toISOString(),
        text: predicate,
        completed_at: new Date().toISOString(),
      });
    ctx.dispatch({
      type: "testStart",
      id: v7(),
      created_at: start.toISOString(),
      reason: props.instruction,
      step: ctx.state().analyze?.step ?? 0,
    });
    const document: AutoBeOpenApi.IDocument | undefined =
      ctx.state().interface?.document;
    if (document === undefined)
      throw new Error("No document found. Please check the logs.");

    // CHECK OPERATIONS
    const operations: AutoBeOpenApi.IOperation[] =
      ctx.state().interface?.document.operations ?? [];
    if (operations.length === 0)
      return ctx.assistantMessage({
        id: v7(),
        type: "assistantMessage",
        created_at: start.toISOString(),
        completed_at: new Date().toISOString(),
        text:
          "Unable to write test code because there are no Operations, " +
          "please check if the Interface agent is called.",
      });

    // PREPARE UTILITIES
    const prepare: IAutoBeTestPrepareWriteResult[] =
      await orchestrateTestWritePrepare(ctx, {
        instruction: props.instruction,
        document,
      });

    const prepareCorrects: AutoBeTestValidateEvent[] =
      await orchestrateTestCorrect(ctx, {
        instruction: props.instruction,
        items: prepare,
      });

    // GENERATE UTILITIES
    const generation: IAutoBeTestGenerationWriteResult[] =
      await orchestrateTestWriteGeneration(ctx, {
        document,
        instruction: props.instruction,
        preparedFunctions: prepare.map((s) => s.function),
      });

    const generationCorrects: AutoBeTestValidateEvent[] =
      await orchestrateTestCorrect(ctx, {
        instruction: props.instruction,
        items: generation,
      });

    // AUTHORIZATION UTILITIES
    const authorization: IAutoBeTestAuthorizationWriteResult[] =
      await orchestrateTestWriteAuthorization(ctx, {
        operations,
      });

    const authorizationCorrects: AutoBeTestValidateEvent[] =
      await orchestrateTestCorrect(ctx, {
        instruction: props.instruction,
        items: authorization,
      });

    // PLAN
    const scenarios: AutoBeTestScenario[] = await orchestrateTestScenario(
      ctx,
      props.instruction,
    );
    if (scenarios.length === 0)
      throw new Error("No scenarios generated. Please check the logs.");

    // TEST CODE
    const written: IAutoBeTestWriteResult[] = await orchestrateTestWrite(ctx, {
      instruction: props.instruction,
      scenarios,
    });
    if (written.length === 0)
      throw new Error("No test code written. Please check the logs.");

    const corrects: AutoBeTestValidateEvent[] = await orchestrateTestCorrect(
      ctx,
      {
        instruction: props.instruction,
        items: written,
      },
    );

    // DO COMPILE
    const compiler: IAutoBeCompiler = await ctx.compiler();
    const compileResult: IAutoBeTypeScriptCompileResult =
      await compiler.typescript.compile({
        files: Object.fromEntries([
          ...Object.entries(
            await ctx.files({
              dbms: "sqlite",
            }),
          ).filter(([key]) => key.endsWith(".ts")),
          ...corrects.map((s) => [s.function.location, s.function.content]),
        ]),
      });

    return ctx.dispatch({
      type: "testComplete",
      id: v7(),
      functions: corrects.map((s) => s.function),
      compiled: compileResult,
      aggregates: ctx.getCurrentAggregates("test"),
      step: ctx.state().interface?.step ?? 0,
      elapsed: new Date().getTime() - start.getTime(),
      created_at: new Date().toISOString(),
    });
  };
