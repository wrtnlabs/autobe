import {
  AutoBeAssistantMessageHistory,
  AutoBeRealizeHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { orchestrateRealizeCoder } from "./orchestrateRealizeCoder";
import { orchestrateRealizePlanner } from "./orchestrateRealizePlanner";

export const orchestrateRealize =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeRealizeHistory> => {
    const ops = ctx.state().interface?.document.operations;
    if (!ops) {
      throw new Error();
    }

    const codes = await Promise.all(
      ops?.map(async (op) => {
        orchestrateRealizePlanner(ctx, op).then(async (plan) => {
          const code = await orchestrateRealizeCoder(ctx, plan);
          return code;
        });
      }),
    );
    props;

    return null!;
  };
