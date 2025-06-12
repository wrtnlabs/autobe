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
    props;
    const start: Date = new Date();
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

    const validate = await orchestrateTestCorrect(ctx, codes);

    ctx.dispatch({
      type: "testComplete",
      created_at: start.toISOString(),
      files: validate.files,
      step: ctx.state().interface?.step ?? 0,
    });

    if (validate.result.type === "success") {
      const history: AutoBeTestHistory = {
        type: "test",
        id: v4(),
        completed_at: new Date().toISOString(),
        created_at: start.toISOString(),
        files: validate.files,
        compiled: validate.result,
        reason: "Step to the test generation referencing the interface",
        step: ctx.state().interface?.step ?? 0,
      };

      ctx.state().test = history;
      ctx.histories().push(history);

      return history;
    }

    if (validate.result.type === "exception") {
      throw new Error(validate.result.error as string);
    } else {
      throw new Error(
        "Failed to compile test code. \n\n" +
          JSON.stringify(validate.result.diagnostics, null, 2),
      );
    }
  };

// 샘플로 쓸만한 asset들 확보해놓기.
