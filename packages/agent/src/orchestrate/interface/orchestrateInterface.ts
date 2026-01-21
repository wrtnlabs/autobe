import {
  AutoBeAssistantMessageHistory,
  AutoBeInterfaceAuthorization,
  AutoBeInterfaceCompleteEvent,
  AutoBeInterfaceEndpointEvent,
  AutoBeInterfaceGroupEvent,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeInterfacePrerequisiteEvent } from "@autobe/interface/src/events/AutoBeInterfacePrerequisiteEvent";
import {
  AutoBeOpenApiEndpointComparator,
  missedOpenApiSchemas,
  revertOpenApiAccessor,
} from "@autobe/utils";
import { HashMap, Pair } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { predicateStateMessage } from "../../utils/predicateStateMessage";
import { IAutoBeFacadeApplicationProps } from "../facade/histories/IAutoBeFacadeApplicationProps";
import { orchestrateInterfaceActionEndpoint } from "./orchestrateInterfaceActionEndpoint";
import { orchestrateInterfaceAuthorization } from "./orchestrateInterfaceAuthorization";
import { orchestrateInterfaceBaseEndpoint } from "./orchestrateInterfaceBaseEndpoint";
import { orchestrateInterfaceComplement } from "./orchestrateInterfaceComplement";
import { orchestrateInterfaceGroup } from "./orchestrateInterfaceGroup";
import { orchestrateInterfaceOperation } from "./orchestrateInterfaceOperation";
import { orchestrateInterfacePrerequisite } from "./orchestrateInterfacePrerequisite";
import { orchestrateInterfaceSchema } from "./orchestrateInterfaceSchema";
import { orchestrateInterfaceSchemaRefine } from "./orchestrateInterfaceSchemaRefine";
import { orchestrateInterfaceSchemaRename } from "./orchestrateInterfaceSchemaRename";
import { orchestrateInterfaceSchemaReview } from "./orchestrateInterfaceSchemaReview";
import { AutoBeInterfaceSchemaReviewProgrammer } from "./programmers/AutoBeInterfaceSchemaReviewProgrammer";
import { AutoBeJsonSchemaFactory } from "./utils/AutoBeJsonSchemaFactory";
import { AutoBeJsonSchemaNamingConvention } from "./utils/AutoBeJsonSchemaNamingConvention";
import { AutoBeJsonSchemaValidator } from "./utils/AutoBeJsonSchemaValidator";

export const orchestrateInterface =
  (ctx: AutoBeContext) =>
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

    //------------------------------------------------
    // OPERATIONS
    //------------------------------------------------
    // ENDPOINTS
    const init: AutoBeInterfaceGroupEvent = await orchestrateInterfaceGroup(
      ctx,
      {
        instruction: props.instruction,
      },
    );
    ctx.dispatch(init);

    // AUTHORIZATION
    const authorizations: AutoBeInterfaceAuthorization[] =
      await orchestrateInterfaceAuthorization(ctx, {
        instruction: props.instruction,
      });
    const authOperations: AutoBeOpenApi.IOperation[] = authorizations
      .map((authorization) => authorization.operations)
      .flat();

    const endpointProgress: AutoBeProgressEventBase = {
      completed: 0,
      total: init.groups.length * endpointSteps.length,
    };
    const endpointReviewProgress: AutoBeProgressEventBase = {
      completed: 0,
      total: init.groups.length * endpointSteps.length,
    };
    // BASE ENDPOINTS
    const baseEndpoints: AutoBeOpenApi.IEndpoint[] =
      await orchestrateInterfaceBaseEndpoint(ctx, {
        instruction: props.instruction,
        groups: init.groups,
        authorizations: authOperations,
        progress: endpointProgress,
        reviewProgress: endpointReviewProgress,
      });
    // ACTION ENDPOINTS
    const actionEndpoints: AutoBeOpenApi.IEndpoint[] =
      await orchestrateInterfaceActionEndpoint(ctx, {
        instruction: props.instruction,
        groups: init.groups,
        authorizations: authOperations,
        baseEndpoints: baseEndpoints,
        progress: endpointProgress,
        reviewProgress: endpointReviewProgress,
      });
    const endpoints: AutoBeOpenApi.IEndpoint[] = [
      ...baseEndpoints,
      ...actionEndpoints,
    ];

    const firstOperations: AutoBeOpenApi.IOperation[] =
      await orchestrateInterfaceOperation(ctx, {
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

    // THE DOCUMENT
    const document: AutoBeOpenApi.IDocument = {
      operations,
      components: {
        authorizations: ctx.state().analyze?.actors ?? [],
        schemas: {},
      },
    };
    AutoBeJsonSchemaNamingConvention.normalize(document);

    //------------------------------------------------
    // DTO SCHEMAS
    //------------------------------------------------
    // RENAME REQUEST/RESPONSE BODY TYPE NAMES
    const renameProgress: AutoBeProgressEventBase = {
      completed: 0,
      total: 0,
    };
    await orchestrateInterfaceSchemaRename(ctx, {
      document,
      progress: renameProgress,
    });

    // PREPARE SCHEMA OVERWRITER
    const overwrite = async (
      schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
    ): Promise<void> => {
      schemas = Object.fromEntries(
        Object.entries(schemas).filter(([_k, v]) => v !== undefined),
      );
      Object.assign(document.components.schemas, schemas);
      Object.assign(
        document.components.schemas,
        AutoBeJsonSchemaFactory.presets(
          new Set(Object.keys(document.components.schemas)),
        ),
      );
      AutoBeJsonSchemaNamingConvention.normalize(document);
      AutoBeJsonSchemaFactory.authorize(document.components.schemas);
      AutoBeJsonSchemaFactory.finalize({
        document,
        application: ctx.state().database!.result.data,
      });
      await orchestrateInterfaceSchemaRename(ctx, {
        document,
        progress: renameProgress,
      });
    };

    // INITIAL SCHEMAS
    await overwrite(
      await orchestrateInterfaceSchema(ctx, {
        instruction: props.instruction,
        operations,
      }),
    );

    // REFINE NONE-OBJECT TYPES
    const refineProgress: AutoBeProgressEventBase = {
      completed: 0,
      total: 0,
    };
    await overwrite(
      await orchestrateInterfaceSchemaRefine(ctx, {
        instruction: props.instruction,
        document,
        schemas: document.components.schemas,
        progress: refineProgress,
      }),
    );

    // REVIEW GENERATED
    const reviewProgress: AutoBeProgressEventBase = {
      completed: 0,
      total:
        Object.keys(document.components.schemas).filter(
          (k) =>
            AutoBeJsonSchemaValidator.isPreset(k) === false &&
            AutoBeJsonSchemaValidator.isObjectType({
              operations: document.operations,
              typeName: k,
            }),
        ).length *
          (REVIEWERS.length - 1) +
        Object.keys(document.components.schemas).filter((key) =>
          AutoBeInterfaceSchemaReviewProgrammer.filterSecurity({
            document,
            typeName: key,
          }),
        ).length,
    };
    for (const config of REVIEWERS)
      await overwrite(
        await orchestrateInterfaceSchemaReview(ctx, config, {
          instruction: props.instruction,
          document,
          schemas: document.components.schemas,
          progress: reviewProgress,
        }),
      );

    // COMPLEMENTATION
    const complementProgress: AutoBeProgressEventBase = {
      completed: 0,
      total: 0,
    };
    while (missedOpenApiSchemas(document).length !== 0) {
      // COMPLEMENT OMITTED
      const complemented: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
        await orchestrateInterfaceComplement(ctx, {
          instruction: props.instruction,
          progress: complementProgress,
          document,
        });
      await overwrite(complemented);
      await overwrite(
        await orchestrateInterfaceSchemaRefine(ctx, {
          instruction: props.instruction,
          document,
          schemas: complemented,
          progress: refineProgress,
        }),
      );

      // REVIEW COMPLEMENTED
      for (const config of REVIEWERS) {
        reviewProgress.total =
          Object.keys(document.components.schemas).length * REVIEWERS.length;
        await overwrite(
          await orchestrateInterfaceSchemaReview(ctx, config, {
            instruction: props.instruction,
            document,
            schemas: complemented,
            progress: reviewProgress,
          }),
        );
      }
    }

    //------------------------------------------------
    // FINALIZATION
    //------------------------------------------------
    // CONNECT PREREQUISITES
    const prerequisites: AutoBeInterfacePrerequisiteEvent[] =
      await orchestrateInterfacePrerequisite(ctx, document);
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
      aggregates: ctx.getCurrentAggregates("interface"),
      step: ctx.state().analyze?.step ?? 0,
      elapsed: new Date().getTime() - start.getTime(),
      created_at: new Date().toISOString(),
    } satisfies AutoBeInterfaceCompleteEvent);
  };

const REVIEWERS = [
  {
    kind: "relation" as const,
    systemPrompt: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_RELATION_REVIEW,
  },
  {
    kind: "content" as const,
    systemPrompt: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_CONTENT_REVIEW,
  },
  {
    kind: "security" as const,
    systemPrompt: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_SECURITY_REVIEW,
  },
  {
    kind: "phantom" as const,
    systemPrompt: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_PHANTOM_REVIEW,
  },
];

const endpointSteps =
  typia.misc.literals<AutoBeInterfaceEndpointEvent["kind"]>();
