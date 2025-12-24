import {
  AutoBeAssistantMessageHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestAuthorizeFunction,
  AutoBeTestFunction,
  AutoBeTestGenerateFunction,
  AutoBeTestHistory,
  AutoBeTestOperationFunction,
  AutoBeTestPrepareFunction,
  AutoBeTestScenario,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { predicateStateMessage } from "../../utils/predicateStateMessage";
import { IAutoBeFacadeApplicationProps } from "../facade/histories/IAutoBeFacadeApplicationProps";
import { orchestrateTestAuthorize } from "./orchestrateTestAuthorize";
import { orchestrateTestGenerate } from "./orchestrateTestGenerate";
import { orchestrateTestOperation } from "./orchestrateTestOperation";
import { orchestrateTestPrepare } from "./orchestrateTestPrepare";
import { orchestrateTestScenario } from "./orchestrateTestScenario";
import { AutoBeTestAuthorizeProgrammer } from "./programmers/AutoBeTestAuthorizeProgrammer";
import { AutoBeTestGenerateProgrammer } from "./programmers/AutoBeTestGenerateProgrammer";
import { AutoBeTestPrepareProgrammer } from "./programmers/AutoBeTestPrepareProgrammer";

export const orchestrateTest =
  (ctx: AutoBeContext) =>
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
    if (document.operations.length === 0)
      return ctx.assistantMessage({
        id: v7(),
        type: "assistantMessage",
        created_at: start.toISOString(),
        completed_at: new Date().toISOString(),
        text:
          "Unable to write test code because there are no Operations, " +
          "please check if the Interface agent is called.",
      });

    // PLAN
    const scenarios: AutoBeTestScenario[] = await orchestrateTestScenario(
      ctx,
      props.instruction,
    );
    if (scenarios.length === 0)
      throw new Error("No scenarios generated. Please check the logs.");

    const writeProgress: AutoBeProgressEventBase = {
      completed: 0,
      total:
        AutoBeTestAuthorizeProgrammer.size(document) +
        AutoBeTestPrepareProgrammer.size(document) +
        AutoBeTestGenerateProgrammer.size(document) +
        scenarios.length,
    };
    const correctProgress: AutoBeProgressEventBase = {
      total: 0,
      completed: 0,
    };

    // MAKE TEST FUNCTIONS
    const prepares: AutoBeTestPrepareFunction[] = await orchestrateTestPrepare(
      ctx,
      {
        instruction: props.instruction,
        document,
        writeProgress,
        correctProgress,
      },
    );
    const generates: AutoBeTestGenerateFunction[] =
      await orchestrateTestGenerate(ctx, {
        instruction: props.instruction,
        document,
        prepares,
        writeProgress,
        correctProgress,
      });
    const authorizes: AutoBeTestAuthorizeFunction[] =
      await orchestrateTestAuthorize(ctx, {
        instruction: props.instruction,
        document,
        writeProgress,
        correctProgress,
      });
    const operations: AutoBeTestOperationFunction[] =
      await orchestrateTestOperation(ctx, {
        instruction: props.instruction,
        document,
        scenarios,
        authorizes,
        prepares,
        generates,
        writeProgress,
        correctProgress,
      });

    // DO COMPILE
    const everyFunctions: AutoBeTestFunction[] = [
      ...authorizes,
      ...prepares,
      ...generates,
      ...operations,
    ];
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
          ...everyFunctions.map((f) => [f.location, f.content]),
        ]),
      });
    return ctx.dispatch({
      type: "testComplete",
      id: v7(),
      functions: everyFunctions,
      compiled: compileResult,
      aggregates: ctx.getCurrentAggregates("test"),
      step: ctx.state().analyze?.step ?? 0,
      elapsed: new Date().getTime() - start.getTime(),
      created_at: new Date().toISOString(),
    });
  };
