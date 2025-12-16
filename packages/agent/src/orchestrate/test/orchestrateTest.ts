import {
  AutoBeAssistantMessageHistory,
  AutoBeOpenApi,
  AutoBeTestHistory,
  AutoBeTestPrepareWriteFunction,
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
import { orchestrateTestAuthorizationWrite } from "./orchestrateTestAuthorizationWrite";
import { orchestrateTestCorrect } from "./orchestrateTestCorrect";
import { orchestrateTestGenerationWrite } from "./orchestrateTestGenerationWrite";
import { orchestrateTestOperationWrite } from "./orchestrateTestOperationWrite";
import { orchestrateTestPrepareWrite } from "./orchestrateTestPrepareWrite";
import { orchestrateTestScenario } from "./orchestrateTestScenario";
import { IAutoBeTestAuthorizeWriteResult } from "./structures/IAutoBeTestAuthorizeWriteResult";
import { IAutoBeTestGenerateWriteResult } from "./structures/IAutoBeTestGenerateWriteResult";
import { IAutoBeTestOperationWriteResult } from "./structures/IAutoBeTestOperationWriteResult";
import { IAutoBeTestPrepareWriteResult } from "./structures/IAutoBeTestPrepareWriteResult";

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

    // PREPARE FUNCTIONS
    const prepared: IAutoBeTestPrepareWriteResult[] =
      await orchestrateTestPrepareWrite(ctx, {
        instruction: props.instruction,
        document,
      });
    const prepareCorrects: AutoBeTestValidateEvent[] =
      await orchestrateTestCorrect(ctx, {
        instruction: props.instruction,
        items: prepared,
      });

    // GENERATION FUNCTIONS
    const generated: IAutoBeTestGenerateWriteResult[] =
      await orchestrateTestGenerationWrite(ctx, {
        instruction: props.instruction,
        document,
        preparedFunctions: prepareCorrects
          .filter(
            (
              p,
            ): p is AutoBeTestValidateEvent & {
              function: AutoBeTestPrepareWriteFunction;
            } => p.function.type === "prepare",
          )
          .map((p) => p.function),
      });
    const generationCorrects: AutoBeTestValidateEvent[] =
      await orchestrateTestCorrect(ctx, {
        instruction: props.instruction,
        items: generated,
      });

    // AUTHORIZATION FUNCTIONS
    const authorized: IAutoBeTestAuthorizeWriteResult[] =
      await orchestrateTestAuthorizationWrite(ctx, {
        operations,
      });
    const authorizationCorrects: AutoBeTestValidateEvent[] =
      await orchestrateTestCorrect(ctx, {
        instruction: props.instruction,
        items: authorized,
      });

    // PLAN
    const scenarios: AutoBeTestScenario[] = await orchestrateTestScenario(
      ctx,
      props.instruction,
    );
    if (scenarios.length === 0)
      throw new Error("No scenarios generated. Please check the logs.");

    // TEST CODE
    const written: IAutoBeTestOperationWriteResult[] =
      await orchestrateTestOperationWrite(ctx, {
        instruction: props.instruction,
        scenarios,
        events: [
          ...prepareCorrects,
          ...generationCorrects,
          ...authorizationCorrects,
        ],
      });
    if (written.length === 0)
      throw new Error("No test code written. Please check the logs.");

    const operationCorrects: AutoBeTestValidateEvent[] =
      await orchestrateTestCorrect(ctx, {
        instruction: props.instruction,
        items: written,
      });

    const corrects: AutoBeTestValidateEvent[] = [
      ...prepareCorrects,
      ...generationCorrects,
      ...authorizationCorrects,
      ...operationCorrects,
    ];

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
          ...Object.entries(
            await compiler.getTemplate({
              dbms: "sqlite",
              phase: "test",
            }),
          ).filter(
            ([key]) => key.startsWith("test/utils") && key.endsWith(".ts"),
          ),
          ...corrects.map((s) => [s.function.location, s.function.content]),
        ]),
      });

    return ctx.dispatch({
      type: "testComplete",
      id: v7(),
      functions: corrects.map((s) => s.function),
      compiled: compileResult,
      aggregates: ctx.getCurrentAggregates("test"),
      step: ctx.state().analyze?.step ?? 0,
      elapsed: new Date().getTime() - start.getTime(),
      created_at: new Date().toISOString(),
    });
  };
