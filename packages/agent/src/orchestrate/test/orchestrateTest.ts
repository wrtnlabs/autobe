import {
  AutoBeAssistantMessageHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestAuthorizeFunction,
  AutoBeTestCompleteEvent,
  AutoBeTestFunction,
  AutoBeTestGenerateFunction,
  AutoBeTestHistory,
  AutoBeTestOperationFunction,
  AutoBeTestPrepareFunction,
  AutoBeTestScenario,
  IAutoBeCompiler,
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
    else if (document.operations.length === 0)
      return ctx.assistantMessage({
        id: v7(),
        type: "assistantMessage",
        created_at: start.toISOString(),
        completed_at: new Date().toISOString(),
        text:
          "Unable to write test code because there are no Operations, " +
          "please check if the Interface agent is called.",
      });

    // SCENARIO PLANNING
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

    // AUTHORIZE
    const authorizes: AutoBeTestAuthorizeFunction[] =
      await orchestrateTestAuthorize(ctx, {
        instruction: props.instruction,
        document,
        writeProgress,
        correctProgress,
      });

    // DATA COMPOSER
    const prepares: AutoBeTestPrepareFunction[] = await orchestrateTestPrepare(
      ctx,
      {
        instruction: props.instruction,
        document,
        writeProgress,
        correctProgress,
      },
    );

    // GENERATOR FUNCTIONS (C of CRUD)
    const generates: AutoBeTestGenerateFunction[] =
      await orchestrateTestGenerate(ctx, {
        instruction: props.instruction,
        document,
        prepares,
        writeProgress,
        correctProgress,
      });

    // ACTUAL TEST FUNCTION
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

    // FINALIZE WITH COMPILATION
    const compiler: IAutoBeCompiler = await ctx.compiler();
    const functions: AutoBeTestFunction[] = [
      ...authorizes,
      ...prepares,
      ...generates,
      ...operations,
    ];
    return ctx.dispatch({
      type: "testComplete",
      id: v7(),
      functions,
      compiled: await compiler.typescript.compile({
        files: Object.fromEntries([
          ...Object.entries(
            await ctx.files({
              dbms: "sqlite",
            }),
          ).filter(
            ([key]) =>
              key.endsWith(".ts") && key.startsWith("test/features") === false,
          ),
          ...functions.map((f) => [f.location, f.content]),
        ]),
      }),
      aggregates: ctx.getCurrentAggregates("test"),
      step: ctx.state().analyze?.step ?? 0,
      elapsed: new Date().getTime() - start.getTime(),
      created_at: new Date().toISOString(),
    } satisfies AutoBeTestCompleteEvent);
  };
