import {
  AutoBeAssistantMessageHistory,
  AutoBeOpenApi,
  AutoBeRealizeHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { orchestrateRealizeCoder } from "./orchestrateRealizeCoder";
import { orchestrateRealizePlanner } from "./orchestrateRealizePlanner";
import { IAutoBeRealizeCoderApplication } from "./structures/IAutoBeRealizeCoderApplication";

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

    const files: Record<string, string> = {
      ...ctx.state().interface?.files,
      ...ctx.state().test?.files.reduce(
        (acc, file) => {
          acc[file.location] = file.content;
          return acc;
        },
        {} as Record<string, string>,
      ),
    };

    const codes: IAutoBeRealizeCoderApplication.IPipeOutput[] =
      await Promise.all(
        ops.map(async (op) => ({
          operation: op,
          result: await pipe(
            op,
            (op) => orchestrateRealizePlanner(ctx, op),
            (p) => orchestrateRealizeCoder(ctx, op, p, files),
          ),
        })),
      );

    const successes: Array<{
      operation: AutoBeOpenApi.IOperation;
      result: IAutoBeRealizeCoderApplication.RealizeCoderOutput;
    }> = [];
    const failures: Array<{
      operation: AutoBeOpenApi.IOperation;
      result: FAILED;
    }> = [];

    for (const code of codes) {
      if (code.result === FAILED) {
        failures.push({
          operation: code.operation,
          result: code.result,
        });
      } else {
        successes.push({
          operation: code.operation,
          result: code.result,
        });
      }
    }

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

export const FAILED = Symbol("FAILED");
export type FAILED = typeof FAILED;

export function pipe<A, B>(
  a: A,
  ab: (a: A) => Promise<B | FAILED>,
): Promise<B | FAILED>;

export function pipe<A, B, C>(
  a: A,
  ab: (a: A) => Promise<B | FAILED>,
  bc: (b: B) => Promise<C | FAILED>,
): Promise<C | FAILED>;

export function pipe<A, B, C, D>(
  a: A,
  ab: (a: A) => Promise<B | FAILED>,
  bc: (b: B) => Promise<C | FAILED>,
  cd: (c: C) => Promise<D | FAILED>,
): Promise<D | FAILED>;

export function pipe<A, B, C, D>(
  a: A,
  ab: (a: A) => Promise<B | FAILED>,
  bc: (b: B) => Promise<C | FAILED>,
  cd: (c: C) => Promise<D | FAILED>,
): Promise<D | FAILED>;

export function pipe(
  a: any,
  ...fns: Array<(arg: any) => Promise<any>>
): Promise<any> {
  return fns.reduce((prev, fn) => {
    return prev.then((result) => {
      if (result === FAILED) return FAILED;
      return fn(result);
    });
  }, Promise.resolve(a));
}
