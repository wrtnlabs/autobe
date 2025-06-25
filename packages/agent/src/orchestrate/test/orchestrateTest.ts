import {
  AutoBeAssistantMessageHistory,
  AutoBeOpenApi,
  AutoBeTestHistory,
  AutoBeTestValidateEvent,
  AutoBeTestWriteEvent,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { orchestrateTestCorrect } from "./orchestrateTestCorrect";
import { orchestrateTestScenario } from "./orchestrateTestScenario";
import { orchestrateTestWrite } from "./orchestrateTestWrite";

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

    const operations: AutoBeOpenApi.IOperation[] =
      ctx.state().interface?.document.operations ?? [];
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

    // PLAN
    const { scenarios } = await orchestrateTestScenario(ctx);

    // TEST CODE
    const codes: AutoBeTestWriteEvent[] = await orchestrateTestWrite(
      ctx,
      scenarios,
    );

    const correct: AutoBeTestValidateEvent = await orchestrateTestCorrect(
      ctx,
      codes,
      scenarios,
    );
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
      files: correct.files
        .map((f) => ({ [f.location]: f.content }))
        .reduce((acc, cur) => Object.assign(acc, cur), {}),
      compiled: correct.result,
      step: ctx.state().interface?.step ?? 0,
    });

    ctx.state().test = history;
    ctx.histories().push(history);

    return history;
  };
