import {
  AutoBeAssistantMessageHistory,
  AutoBeOpenApi,
  AutoBeRealizeAuthorization,
  AutoBeRealizeFunction,
  AutoBeRealizeHistory,
  IAutoBeCompiler,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { getAutoBeGenerated } from "../../factory/getAutoBeGenerated";
import { orchestrateRealizeAuthorization } from "./orchestrateRealizeAuthorization";
import { writeCodeUntilCompilePassed } from "./writeCodeUntilCompilePassed";

export const orchestrateRealize =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeRealizeHistory> => {
    const operations: AutoBeOpenApi.IOperation[] | undefined =
      ctx.state().interface?.document.operations;
    if (!operations) {
      throw new Error("Can't do realize agent because operations are nothing.");
    }

    const start: Date = new Date();
    ctx.dispatch({
      type: "realizeStart",
      created_at: new Date().toISOString(),
      reason: props.reason,
      step: ctx.state().test?.step ?? 0,
    });

    // generate authorizations and functions
    const authorizations: AutoBeRealizeAuthorization[] =
      await orchestrateRealizeAuthorization(ctx);
    const functions: AutoBeRealizeFunction[] =
      await writeCodeUntilCompilePassed(ctx)({
        operations,
        authorizations,
        retry: 4,
      });

    // compile controllers
    const compiler: IAutoBeCompiler = await ctx.compiler();
    const controllers: Record<string, string> =
      await compiler.realize.controller({
        document: ctx.state().interface!.document,
        functions,
        authorizations,
      });

    // report
    const history: AutoBeRealizeHistory = (ctx.state().realize = {
      type: "realize",
      compiled: {
        type: "success",
      },
      authorizations,
      functions,
      controllers,
      completed_at: new Date().toISOString(),
      created_at: start.toISOString(),
      id: v4(),
      reason: props.reason,
      step: ctx.state().analyze?.step ?? 0,
    } satisfies AutoBeRealizeHistory);

    ctx.dispatch({
      type: "realizeComplete",
      created_at: new Date().toISOString(),
      functions: history.functions,
      authorizations: history.authorizations,
      controllers: history.controllers,
      compiled: await compiler.typescript.compile({
        files: await getAutoBeGenerated(
          compiler,
          {
            ...ctx.state(),
            realize: history,
          },
          [...ctx.histories(), history],
          ctx.usage(),
        ),
      }),
      step: ctx.state().analyze?.step ?? 0,
    });
    ctx.state().realize = history;
    ctx.histories().push(history);

    return history;
  };
