import {
  AutoBeAssistantMessageHistory,
  AutoBeInterfaceCompleteEvent,
  AutoBeInterfaceEndpointsEvent,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { orchestrateInterfaceComplement } from "./orchestrateInterfaceComplement";
import { orchestrateInterfaceComponents } from "./orchestrateInterfaceComponents";
import { orchestrateInterfaceEndpoints } from "./orchestrateInterfaceEndpoints";
import { orchestrateInterfaceOperations } from "./orchestrateInterfaceOperations";

export const orchestrateInterface =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeInterfaceHistory> => {
    // ENDPOINTS
    const start: Date = new Date();
    ctx.dispatch({
      type: "interfaceStart",
      created_at: start.toISOString(),
      reason: props.reason,
      step: ctx.state().analyze?.step ?? 0,
    });

    const init: AutoBeAssistantMessageHistory | AutoBeInterfaceEndpointsEvent =
      await orchestrateInterfaceEndpoints(ctx);
    if (init.type === "assistantMessage") {
      ctx.dispatch(init);
      ctx.histories().push(init);
      return init;
    } else ctx.dispatch(init);

    // OPERATIONS
    const operations: AutoBeOpenApi.IOperation[] =
      await orchestrateInterfaceOperations(ctx, init.endpoints);

    // TYPE SCHEMAS
    const document: AutoBeOpenApi.IDocument = {
      operations,
      components: await orchestrateInterfaceComponents(ctx, operations),
    };
    document.components = await orchestrateInterfaceComplement(ctx, document);

    // DO COMPILE
    const result: AutoBeInterfaceHistory = {
      type: "interface",
      id: v4(),
      document,
      files: await ctx.compiler.interface.compile(document),
      reason: props.reason,
      step: ctx.state().analyze?.step ?? 0,
      created_at: start.toISOString(),
      completed_at: new Date().toISOString(),
    };
    ctx.state().interface = result;
    ctx.histories().push(result);
    ctx.dispatch({
      type: "interfaceComplete",
      files: result.files,
      document: result.document,
      created_at: start.toISOString(),
      reason: props.reason,
      step: ctx.state().analyze?.step ?? 0,
    } satisfies AutoBeInterfaceCompleteEvent);
    return result;
  };
