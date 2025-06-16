import {
  AutoBeAssistantMessageHistory,
  AutoBeTestHistory,
  AutoBeTestProgressEvent,
} from "@autobe/interface";
import { AutoBeTestScenarioEvent } from "@autobe/interface/src/events/AutoBeTestScenarioEvent";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { orchestrateTestCorrect } from "./orchestrateTestCorrect";
import { orchestrateTestProgress } from "./orchestrateTestProgress";
import { orchestrateTestScenario } from "./orchestrateTestScenario";

export const orchestrateTest =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeTestHistory> => {
    const start: Date = new Date();
    ctx.dispatch({
      type: "testStart",
      created_at: start.toISOString(),
      reason: props.reason,
      step: ctx.state().analyze?.step ?? 0,
    });

    const operations = ctx.state().interface?.document.operations ?? [];
    if (operations.length === 0) {
      const history: AutoBeAssistantMessageHistory = {
        id: v4(),
        type: "assistantMessage",
        created_at: start.toISOString(),
        completed_at: new Date().toISOString(),
        text:
          "Unable to write test code because there are no Operations, " +
          "please check if the Interface agent is called.",
      };

      ctx.histories().push(history);
      ctx.dispatch(history);

      return history;
    }

    // SCENARIOS
    const scenarioEvent: AutoBeTestScenarioEvent =
      await orchestrateTestScenario(ctx);

    const scenarios = scenarioEvent.scenarios
      .map((scenario) => {
        return scenario.scenarios;
      })
      .flat();

    const codes: AutoBeTestProgressEvent[] = await orchestrateTestProgress(
      ctx,
      scenarios,
    );

    const correct = await orchestrateTestCorrect(ctx, codes);

    const history: AutoBeTestHistory = {
      type: "test",
      id: v4(),
      completed_at: new Date().toISOString(),
      created_at: start.toISOString(),
      files: correct.files,
      compiled: correct.result,
      reason: "Step to the test generation referencing the interface",
      step: ctx.state().interface?.step ?? 0,
    };

    ctx.dispatch({
      type: "testComplete",
      created_at: start.toISOString(),
      files: correct.files,
      step: ctx.state().interface?.step ?? 0,
    });

    ctx.state().test = history;
    ctx.histories().push(history);

    return history;
  };
