import {
  AutoBeAssistantMessageHistory,
  AutoBeInterfaceAuthorization,
  AutoBeInterfaceCompleteEvent,
  AutoBeInterfaceGroupsEvent,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
} from "@autobe/interface";
import { AutoBeInterfacePrerequisite } from "@autobe/interface/src/histories/contents/AutoBeInterfacePrerequisite";
import {
  AutoBeOpenApiEndpointComparator,
  missedOpenApiSchemas,
  revertOpenApiAccessor,
} from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";
import { HashMap, Pair } from "tstl";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeFacadeApplicationProps } from "../../context/IAutoBeFacadeApplicationProps";
import { predicateStateMessage } from "../../utils/predicateStateMessage";
import { orchestrateInterfaceAuthorizations } from "./orchestrateInterfaceAuthorizations";
import { orchestrateInterfaceComplement } from "./orchestrateInterfaceComplement";
import { orchestrateInterfaceEndpoints } from "./orchestrateInterfaceEndpoints";
import { orchestrateInterfaceGroups } from "./orchestrateInterfaceGroups";
import { orchestrateInterfaceOperations } from "./orchestrateInterfaceOperations";
import { orchestrateInterfacePrerequisites } from "./orchestrateInterfacePrerequisites";
import { orchestrateInterfaceSchemas } from "./orchestrateInterfaceSchemas";
import { orchestrateInterfaceSchemasReview } from "./orchestrateInterfaceSchemasReview";
import { JsonSchemaFactory } from "./utils/JsonSchemaFactory";

export const orchestrateInterface =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeFacadeApplicationProps,
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
        id: v7(),
        created_at: start.toISOString(),
        text: predicate,
        completed_at: new Date().toISOString(),
      });
    ctx.dispatch({
      type: "interfaceStart",
      id: v7(),
      created_at: start.toISOString(),
      reason: props.instruction,
      step: ctx.state().analyze?.step ?? 0,
    });

    // ENDPOINTS
    const init: AutoBeInterfaceGroupsEvent = await orchestrateInterfaceGroups(
      ctx,
      {
        instruction: props.instruction,
      },
    );
    ctx.dispatch(init);

    // AUTHORIZATION
    const authorizations: AutoBeInterfaceAuthorization[] =
      await orchestrateInterfaceAuthorizations(ctx, props.instruction);
    const authOperations: AutoBeOpenApi.IOperation[] = authorizations
      .map((authorization) => authorization.operations)
      .flat();

    // ENDPOINTS & OPERATIONS
    const endpoints: AutoBeOpenApi.IEndpoint[] =
      await orchestrateInterfaceEndpoints(ctx, {
        groups: init.groups,
        authorizations: authOperations,
        instruction: props.instruction,
      });
    const firstOperations: AutoBeOpenApi.IOperation[] =
      await orchestrateInterfaceOperations(ctx, {
        endpoints,
        instruction: props.instruction,
      });
    const operations: AutoBeOpenApi.IOperation[] = new HashMap<
      AutoBeOpenApi.IEndpoint,
      AutoBeOpenApi.IOperation
    >(
      [...authOperations, ...firstOperations].map(
        (o) =>
          new Pair(
            {
              path: o.path,
              method: o.method,
            },
            o, // early inserted be kept
          ),
      ),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    )
      .toJSON()
      .map((it) => it.second);

    // TYPE SCHEMAS
    const document: AutoBeOpenApi.IDocument = {
      operations,
      components: {
        authorization: ctx.state().analyze?.roles ?? [],
        schemas: await orchestrateInterfaceSchemas(ctx, {
          instruction: props.instruction,
          operations,
        }),
      },
    };

    const complement = async () =>
      Object.assign(
        document.components.schemas,
        await orchestrateInterfaceComplement(ctx, {
          instruction: props.instruction,
          document,
        }),
      );
    await complement();

    Object.assign(
      document.components.schemas,
      await orchestrateInterfaceSchemasReview(
        ctx,
        operations,
        document.components.schemas,
      ),
    );
    if (missedOpenApiSchemas(document).length !== 0) await complement();

    JsonSchemaFactory.finalize({
      document,
      application: ctx.state().prisma!.result.data,
    });

    // CONNECT PRE-REQUISITES
    const prerequisites: AutoBeInterfacePrerequisite[] =
      await orchestrateInterfacePrerequisites(ctx, document);
    document.operations.forEach((op) => {
      op.prerequisites =
        prerequisites.find(
          (p) => p.endpoint.method === op.method && p.endpoint.path === op.path,
        )?.prerequisites ?? [];
    });

    // NORMALIZE ACCESSORS
    revertOpenApiAccessor(document);

    // DO COMPILE
    return ctx.dispatch({
      type: "interfaceComplete",
      id: v7(),
      document,
      missed: missedOpenApiSchemas(document),
      authorizations,
      created_at: new Date().toISOString(),
      elapsed: new Date().getTime() - start.getTime(),
      step: ctx.state().analyze?.step ?? 0,
    } satisfies AutoBeInterfaceCompleteEvent);
  };
