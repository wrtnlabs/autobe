import {
  AutoBeAssistantMessageHistory,
  AutoBeInterfaceAuthorization,
  AutoBeInterfaceCompleteEvent,
  AutoBeInterfaceGroupEvent,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
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

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeFacadeApplicationProps } from "../../context/IAutoBeFacadeApplicationProps";
import { AutoBeProcessAggregateFactory } from "../../factory/AutoBeProcessAggregateFactory";
import { predicateStateMessage } from "../../utils/predicateStateMessage";
import { orchestrateInterfaceAuthorizations } from "./orchestrateInterfaceAuthorizations";
import { orchestrateInterfaceComplement } from "./orchestrateInterfaceComplement";
import { orchestrateInterfaceEndpoints } from "./orchestrateInterfaceEndpoints";
import { orchestrateInterfaceGroups } from "./orchestrateInterfaceGroups";
import { orchestrateInterfaceOperations } from "./orchestrateInterfaceOperations";
import { orchestrateInterfacePrerequisites } from "./orchestrateInterfacePrerequisites";
import { orchestrateInterfaceSchemaRename } from "./orchestrateInterfaceSchemaRename";
import { orchestrateInterfaceSchemaReview } from "./orchestrateInterfaceSchemaReview";
import { orchestrateInterfaceSchemas } from "./orchestrateInterfaceSchemas";
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
    const init: AutoBeInterfaceGroupEvent = await orchestrateInterfaceGroups(
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
        authorizations: ctx.state().analyze?.actors ?? [],
        schemas: await orchestrateInterfaceSchemas(ctx, {
          instruction: props.instruction,
          operations,
        }),
      },
    };

    const assign = (
      schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
    ) => Object.assign(document.components.schemas, schemas);
    const complement = async () =>
      assign(
        await orchestrateInterfaceComplement(ctx, {
          instruction: props.instruction,
          document,
        }),
      );
    await complement();

    const reviewProgress: AutoBeProgressEventBase = {
      completed: 0,
      total: Math.ceil(
        Object.keys(document.components.schemas).length /
          AutoBeConfigConstant.INTERFACE_CAPACITY,
      ),
    };
    for (const config of [
      {
        kind: "security" as const,
        systemPrompt:
          AutoBeSystemPromptConstant.INTERFACE_SCHEMA_SECURITY_REVIEW,
      },
      {
        kind: "relation" as const,
        systemPrompt:
          AutoBeSystemPromptConstant.INTERFACE_SCHEMA_RELATION_REVIEW,
      },
      {
        kind: "content" as const,
        systemPrompt:
          AutoBeSystemPromptConstant.INTERFACE_SCHEMA_CONTENT_REVIEW,
      },
    ])
      assign(
        await orchestrateInterfaceSchemaReview(ctx, config, {
          instruction: props.instruction,
          document,
          progress: reviewProgress,
        }),
      );
    if (missedOpenApiSchemas(document).length !== 0) await complement();

    await orchestrateInterfaceSchemaRename(ctx, document);
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
      aggregates: AutoBeProcessAggregateFactory.filterPhase(
        ctx.aggregates,
        "interface",
      ),
      step: ctx.state().analyze?.step ?? 0,
      elapsed: new Date().getTime() - start.getTime(),
      created_at: new Date().toISOString(),
    } satisfies AutoBeInterfaceCompleteEvent);
  };
