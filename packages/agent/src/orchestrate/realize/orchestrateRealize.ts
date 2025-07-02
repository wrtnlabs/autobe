import {
  AutoBeAssistantMessageHistory,
  AutoBeRealizeHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { orchestrateRealizeCoder } from "./orchestrateRealizeCoder";
import { orchestrateRealizeIntegrator } from "./orchestrateRealizeIntegrator";
import { orchestrateRealizePlanner } from "./orchestrateRealizePlanner";
import {
  RealizeValidatorOutput,
  orchestrateRealizeValidator,
} from "./orchestrateRealizeValidator";

export const orchestrateRealize =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeRealizeHistory> => {
    props;

    const ops = ctx.state().interface?.document.operations;
    if (!ops) {
      throw new Error();
    }

    const codes: (RealizeValidatorOutput | FAILED)[] = await Promise.all(
      ops.map(async (op) =>
        pipe(
          op,
          (op) => orchestrateRealizePlanner(ctx, op),
          (p) => orchestrateRealizeCoder(ctx, p),
          (c) => orchestrateRealizeIntegrator(ctx, c),
          (i) => orchestrateRealizeValidator(ctx, i),
        ),
      ),
    );

    if (codes.length) {
      if (codes.every((code) => code !== FAILED)) {
        const files = {
          ...ctx.state().interface?.files,
          ...codes
            .map((code) => ({ [code.location]: code.content }))
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
        const failedCount = codes.filter((code) => code === FAILED).length;
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

export const FAILED = Symbol("FAILED");
export type FAILED = typeof FAILED;

function pipe<A, B, C, D, E>(
  a: A,
  ab: (a: A) => Promise<B | FAILED>,
  bc: (b: B) => Promise<C | FAILED>,
  cd: (c: C) => Promise<D | FAILED>,
  de: (d: D) => Promise<E | FAILED>,
): Promise<E | FAILED>;

function pipe(a: any, ...fns: Array<(arg: any) => Promise<any>>): Promise<any> {
  return fns.reduce((prev, fn) => {
    return prev.then((result) => {
      if (result === FAILED) return FAILED;
      return fn(result);
    });
  }, Promise.resolve(a));
}
