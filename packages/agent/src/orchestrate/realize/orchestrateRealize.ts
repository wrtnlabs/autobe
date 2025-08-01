import {
  AutoBeAssistantMessageHistory,
  AutoBeOpenApi,
  AutoBeRealizeAuthorization,
  AutoBeRealizeFunction,
  AutoBeRealizeHistory,
  IAutoBeCompiler,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { getAutoBeGenerated } from "../../factory/getAutoBeGenerated";
import { getAutoBeRealizeGenerated } from "../../factory/getAutoBeRealizeGenerated";
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

    ctx.dispatch({
      type: "realizeStart",
      created_at: new Date().toISOString(),
      reason: props.reason,
      step: ctx.state().test?.step ?? 0,
    });

    // generate authorizations and functions
    const authorizations: AutoBeRealizeAuthorization[] =
      await orchestrateRealizeAuthorization(ctx);
    const result = await writeCodeUntilCompilePassed(ctx)({
      operations,
      authorizations,
      retry: 4,
    });

    const functions: AutoBeRealizeFunction[] = result.functions;

    // compile controllers
    const compiler: IAutoBeCompiler = await ctx.compiler();
    const controllers: Record<string, string> =
      await compiler.realize.controller({
        document: ctx.state().interface!.document,
        functions,
        authorizations,
      });

    // report
    return ctx.dispatch({
      type: "realizeComplete",
      created_at: new Date().toISOString(),
      functions,
      authorizations,
      controllers,
      compiled: await compiler.typescript.compile({
        files: {
          ...(await getAutoBeGenerated(
            compiler,
            ctx.state(),
            ctx.histories(),
            ctx.usage(),
          )),
          ...(await getAutoBeRealizeGenerated({
            document: ctx.state().interface!.document,
            authorizations,
            functions,
            compiler,
          })),
        },
      }),
      step: ctx.state().analyze?.step ?? 0,
    });
  };
