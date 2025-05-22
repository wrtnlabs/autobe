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

    // COMPONENTS
    const components: AutoBeOpenApi.IComponents =
      await orchestrateInterfaceComponents(ctx, operations);

    // TYPESCRIPT CODE GENERATION
    const document: AutoBeOpenApi.IDocument = {
      operations,
      components,
    };
    const result: AutoBeInterfaceHistory = {
      type: "interface",
      id: v4(),
      document,
      files: await ctx.compiler.interface(document),
      reason: props.reason,
      step: ctx.state().analyze?.step ?? 0,
      created_at: start.toISOString(),
      completed_at: new Date().toISOString(),
    };
    ctx.histories().push(result);
    ctx.state().interface = result;
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
