import {
  AutoBeAssistantMessageHistory,
  AutoBeInterfaceCompleteEvent,
  AutoBeInterfaceGroupsEvent,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { orchestrateInterfaceComplement } from "./orchestrateInterfaceComplement";
import { orchestrateInterfaceEndpoints } from "./orchestrateInterfaceEndpoints";
import { orchestrateInterfaceGroups } from "./orchestrateInterfaceGroups";
import { orchestrateInterfaceOperations } from "./orchestrateInterfaceOperations";
import { orchestrateInterfaceSchemas } from "./orchestrateInterfaceSchemas";

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

    const init: AutoBeAssistantMessageHistory | AutoBeInterfaceGroupsEvent =
      await orchestrateInterfaceGroups(ctx);
    if (init.type === "assistantMessage") {
      ctx.dispatch(init);
      ctx.histories().push(init);
      return init;
    } else ctx.dispatch(init);

    // ENDPOINTS & OPERATIONS
    const endpoints: AutoBeOpenApi.IEndpoint[] =
      await orchestrateInterfaceEndpoints(ctx, init.groups);
    const operations: AutoBeOpenApi.IOperation[] =
      await orchestrateInterfaceOperations(ctx, endpoints);

    // TYPE SCHEMAS
    const document: AutoBeOpenApi.IDocument = {
      operations,
      components: {
        authorization: ctx.state().analyze?.roles ?? [],
        schemas: await orchestrateInterfaceSchemas(ctx, operations),
      },
    };
    document.components.schemas = await orchestrateInterfaceComplement(
      ctx,
      document,
    );

    // DO COMPILE
    const result: AutoBeInterfaceHistory = {
      type: "interface",
      id: v4(),
      document,
      reason: props.reason,
      step: ctx.state().analyze?.step ?? 0,
      created_at: start.toISOString(),
      completed_at: new Date().toISOString(),
    };
    ctx.state().interface = result;
    ctx.histories().push(result);
    ctx.dispatch({
      type: "interfaceComplete",
      document: result.document,
      created_at: start.toISOString(),
      reason: props.reason,
      step: ctx.state().analyze?.step ?? 0,
    } satisfies AutoBeInterfaceCompleteEvent);
    return result;
  };
