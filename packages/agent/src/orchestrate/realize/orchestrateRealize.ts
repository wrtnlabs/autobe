import {
  AutoBeAssistantMessageHistory,
  AutoBeRealizeHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { orchestrateRealizeDecorator } from "./orchestrateRealizeDecorator";
import { writeCodeUntilCompilePassed } from "./writeCodeUntilCompilePassed";

export const orchestrateRealize =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeRealizeHistory> => {
    props;
    const ops = ctx.state().interface?.document.operations;
    if (!ops) {
      throw new Error("Can't do realize agent because operations are nothing.");
    }

    ctx.dispatch({
      type: "realizeStart",
      created_at: new Date().toISOString(),
      reason: props.reason,
      step: ctx.state().test?.step ?? 0,
    });

    const decorators = await orchestrateRealizeDecorator(ctx);
    decorators;

    await writeCodeUntilCompilePassed(ctx, ops, 3);
    const now = new Date().toISOString();
    ctx.dispatch({
      type: "assistantMessage",
      text: "Any codes can not be generated.",
      created_at: now,
    });

    return {
      type: "realize",
      compiled: 1 as any,
      files: {},
      completed_at: now,
      created_at: now,
      id: v4(),
      reason: props.reason,
      step: ctx.state().test?.step ?? 0,
    };
  };
