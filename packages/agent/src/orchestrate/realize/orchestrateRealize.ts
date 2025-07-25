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
    const files = await writeCodeUntilCompilePassed(ctx, ops, decorators, 2);

    const now = new Date().toISOString();
    const realize = ctx.state().realize;
    if (realize !== null) {
      realize.functions = files;
    } else {
      const history = (ctx.state().realize = {
        type: "realize",
        compiled: {
          type: "success",
        },
        functions: files,
        completed_at: now,
        created_at: now,
        id: v4(),
        reason: props.reason,
        step: ctx.state().analyze?.step ?? 0,
        decorators: ctx.state().realize?.decorators ?? [],
      } satisfies AutoBeRealizeHistory);

      ctx.histories().push(history);
    }

    ctx.dispatch({
      type: "assistantMessage",
      text: "Any codes can not be generated.",
      created_at: now,
    });

    return {
      type: "realize",
      compiled: {
        type: "success",
      },
      functions: files,
      completed_at: now,
      created_at: now,
      id: v4(),
      reason: props.reason,
      step: ctx.state().analyze?.step ?? 0,
      decorators: ctx.state().realize?.decorators ?? [],
    };
  };
