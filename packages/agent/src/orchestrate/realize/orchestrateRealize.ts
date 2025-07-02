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

    const codes: RealizeValidatorOutput[] = await Promise.all(
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

function pipe<A, B, C, D, E>(
  a: A,
  ab: (a: A) => Promise<B>,
  bc: (b: B) => Promise<C>,
  cd: (c: C) => Promise<D>,
  de: (d: D) => Promise<E>,
): Promise<E>;

function pipe(a: any, ...fns: Array<(arg: any) => Promise<any>>): Promise<any> {
  return fns.reduce((prev, fn) => prev.then(fn), Promise.resolve(a));
}
