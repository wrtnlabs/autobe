import {
  AutoBeAssistantMessageHistory,
  AutoBeRealizeHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { orchestrateRealizeCoder } from "./orchestrateRealizeCoder";
import { orchestrateRealizePlanner } from "./orchestrateRealizePlanner";
import { orchestrateRealizeValidator } from "./orchestrateRealizeValidator";

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
        return orchestrateRealizePlanner(ctx, op).then(async (plan) => {
          return orchestrateRealizeCoder(ctx, plan).then((code) => {
            return orchestrateRealizeValidator(ctx, code); // -- --include function_name
          });
        });
      }),
    );
    props;

    if (codes.length) {
      const files = {
        ...ctx.state().interface?.files,
        ...codes
          .map((code) => ({ [code.location]: code.content }))
          .reduce((acc, cur) => Object.assign(acc, cur), {}),
      };

      const compiled = await ctx.compiler.typescript.compile({ files });

      return {
        id: v4(),
        type: "realize",
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        compiled,
        files,
        reason: "",
        step: ctx.state().analyze?.step ?? 0,
      };
    }

    return {
      id: v4(),
      type: "assistantMessage",
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      text: "Any codes can not be generated.",
    };
  };
