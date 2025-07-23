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

    const files = await writeCodeUntilCompilePassed(ctx, ops, 5);
    const providers = files
      .map((f) => ({ [f.filename]: f.implementationCode }))
      .reduce((acc, cur) => Object.assign(acc, cur), {});

    const now = new Date().toISOString();
    const realize = ctx.state().realize;
    if (realize !== null) {
      realize.files = providers;
    } else {
      ctx.state().realize = {
        type: "realize",
        compiled: {
          type: "success",
        },
        files: providers,
        completed_at: now,
        created_at: now,
        id: v4(),
        reason: props.reason,
        step: ctx.state().analyze?.step ?? 0,
      } satisfies AutoBeRealizeHistory;
    }

    ctx.dispatch({
      type: "assistantMessage",
      text: "Any codes can not be generated.",
      created_at: now,
    });

    console.log(JSON.stringify(providers, null, 2), "providers");

    return {
      type: "realize",
      compiled: {
        type: "success",
      },
      files: providers,
      completed_at: now,
      created_at: now,
      id: v4(),
      reason: props.reason,
      step: ctx.state().analyze?.step ?? 0,
    };
  };
