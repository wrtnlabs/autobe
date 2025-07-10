import {
  AutoBeAssistantMessageHistory,
  AutoBeRealizeHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { pipe } from "./RealizePipe";
import { orchestrateRealizeIntegrator } from "./orchestrateRealizeIntegrator";
import {
  RealizeValidatorOutput,
  orchestrateRealizeValidator,
} from "./orchestrateRealizeValidator";
import { FAILED } from "./structures/IAutoBeReailizeFailedSymbol";
import { writeCodeUntilCompilePassed } from "./writeCodeUntilCompilePassed";

export const orchestrateRealize =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeRealizeHistory> => {
    props;

    const ops = ctx.state().interface?.document.operations;
    if (!ops) {
      throw new Error("Can't do realize agent beacuse operations are nothing.");
    }

    const codes = await writeCodeUntilCompilePassed(ctx, ops, 3);
    const vaildates: (RealizeValidatorOutput | FAILED)[] = await Promise.all(
      codes.map(async (c) =>
        pipe(
          c,
          (c) => orchestrateRealizeIntegrator(ctx, c),
          (i) => orchestrateRealizeValidator(ctx, i),
        ),
      ),
    );

    if (vaildates.length) {
      if (vaildates.every((v) => v !== FAILED)) {
        const files = {
          ...ctx.state().interface?.files,
          ...vaildates
            .map((v) => ({ [v.location]: v.content }))
            .reduce((acc, cur) => Object.assign(acc, cur), {}),
        };

        const compiled = await ctx.compiler.typescript.compile({ files });

        const now = new Date().toISOString();
        ctx.dispatch({
          type: "realizeComplete",
          compiled: compiled,
          created_at: now,
          files: files,
          step: ctx.state().analyze?.step ?? 0,
        });

        return {
          id: v4(),
          type: "realize",
          completed_at: now,
          created_at: now,
          compiled,
          files,
          reason: props.reason,
          step: ctx.state().analyze?.step ?? 0,
        } satisfies AutoBeRealizeHistory;
      } else {
        const total = codes.length;
        const failedCount = codes.length;
        const successCount = total - failedCount;

        const now = new Date().toISOString();
        ctx.dispatch({
          type: "assistantMessage",
          text: [
            `Out of ${total} code blocks, ${successCount} succeeded, but ${failedCount} failed.`,
            `The process has been stopped due to the failure. Please review the failed steps and try again.`,
          ].join("\n"),
          created_at: now,
        });

        return {
          id: v4(),
          type: "assistantMessage",
          completed_at: now,
          created_at: now,
          text: [
            `Out of ${total} code blocks, ${successCount} succeeded, but ${failedCount} failed.`,
            `The process has been stopped due to the failure. Please review the failed steps and try again.`,
          ].join("\n"),
        } satisfies AutoBeAssistantMessageHistory;
      }
    }

    const now = new Date().toISOString();
    ctx.dispatch({
      type: "assistantMessage",
      text: "Any codes can not be generated.",
      created_at: now,
    });

    return {
      id: v4(),
      type: "assistantMessage",
      completed_at: now,
      created_at: now,
      text: "Any codes can not be generated.",
    } satisfies AutoBeAssistantMessageHistory;
  };
