import {
  AutoBeAssistantMessageHistory,
  AutoBeInterfaceCompleteEvent,
  AutoBeInterfaceGroupsEvent,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { orchestrateInterfaceAuthorizations } from "./orchestrateInterfaceAuthorizations";
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
    if (init.type === "assistantMessage") return ctx.assistantMessage(init);
    else ctx.dispatch(init);

    // AUTHORIZATION
    const authorizations: AutoBeOpenApi.IOperation[] =
      await orchestrateInterfaceAuthorizations(ctx);

    // ENDPOINTS & OPERATIONS
    const endpoints: AutoBeOpenApi.IEndpoint[] =
      await orchestrateInterfaceEndpoints(ctx, init.groups, authorizations);
    const operations: AutoBeOpenApi.IOperation[] =
      await orchestrateInterfaceOperations(ctx, endpoints);

    operations.push(...authorizations);

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
    return ctx.dispatch({
      type: "interfaceComplete",
      document,
      created_at: new Date().toISOString(),
      elapsed: new Date().getTime() - start.getTime(),
      step: ctx.state().analyze?.step ?? 0,
    } satisfies AutoBeInterfaceCompleteEvent);
  };
