import {
  AutoBeAssistantMessageHistory,
  AutoBeInterfaceCompleteEvent,
  AutoBeInterfaceGroupsEvent,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
} from "@autobe/interface";
import { AutoBeEndpointComparator } from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";
import { HashMap, Pair } from "tstl";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { predicateStateMessage } from "../../utils/predicateStateMessage";
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
    // PREDICATION
    const start: Date = new Date();
    const predicate: string | null = predicateStateMessage(
      ctx.state(),
      "interface",
    );
    if (predicate !== null)
      return ctx.assistantMessage({
        type: "assistantMessage",
        id: v4(),
        created_at: start.toISOString(),
        text: predicate,
        completed_at: new Date().toISOString(),
      });
    ctx.dispatch({
      type: "interfaceStart",
      created_at: start.toISOString(),
      reason: props.reason,
      step: ctx.state().analyze?.step ?? 0,
    });

    // ENDPOINTS
    const init: AutoBeInterfaceGroupsEvent =
      await orchestrateInterfaceGroups(ctx);
    ctx.dispatch(init);

    // AUTHORIZATION
    const authorizations: AutoBeOpenApi.IOperation[] =
      await orchestrateInterfaceAuthorizations(ctx);

    // ENDPOINTS & OPERATIONS
    const endpoints: AutoBeOpenApi.IEndpoint[] =
      await orchestrateInterfaceEndpoints(ctx, init.groups, authorizations);
    const firstOperations: AutoBeOpenApi.IOperation[] =
      await orchestrateInterfaceOperations(ctx, endpoints);
    const operations: AutoBeOpenApi.IOperation[] = new HashMap<
      AutoBeOpenApi.IEndpoint,
      AutoBeOpenApi.IOperation
    >(
      [...authorizations, ...firstOperations].map(
        (o) =>
          new Pair(
            {
              path: o.path,
              method: o.method,
            },
            o, // early inserted be kept
          ),
      ),
      AutoBeEndpointComparator.hashCode,
      AutoBeEndpointComparator.equals,
    )
      .toJSON()
      .map((it) => it.second);

    // TYPE SCHEMAS
    const document: AutoBeOpenApi.IDocument = {
      operations,
      components: {
        authorization: ctx.state().analyze?.roles ?? [],
        schemas: await orchestrateInterfaceSchemas(ctx, operations),
      },
    };
    Object.assign(
      document.components.schemas,
      await orchestrateInterfaceComplement(ctx, document),
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
