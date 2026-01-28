import {
  AutoBeAssistantMessageHistory,
  AutoBeInterfaceAuthorization,
  AutoBeInterfaceCompleteEvent,
  AutoBeInterfaceEndpointDesign,
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
import { orchestrateInterfaceGroup } from "./orchestrateInterfaceGroup";
import { orchestrateInterfaceOperation } from "./orchestrateInterfaceOperation";
import { orchestrateInterfacePrerequisite } from "./orchestrateInterfacePrerequisite";
import { orchestrateInterfaceSchema } from "./orchestrateInterfaceSchema";
import { orchestrateInterfaceSchemaCasting } from "./orchestrateInterfaceSchemaCasting";
import { orchestrateInterfaceSchemaComplement } from "./orchestrateInterfaceSchemaComplement";
import { orchestrateInterfaceSchemaRename } from "./orchestrateInterfaceSchemaRename";
import { orchestrateInterfaceSchemaReview } from "./orchestrateInterfaceSchemaReview";
import { AutoBeInterfaceSchemaReviewProgrammer } from "./programmers/AutoBeInterfaceSchemaReviewProgrammer";
import { AutoBeJsonSchemaCollection } from "./utils/AutoBeJsonSchemaCollection";
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
    const baseEndpoints: AutoBeInterfaceEndpointDesign[] =
      await orchestrateInterfaceBaseEndpoint(ctx, {
        instruction: props.instruction,
        groups: init.groups,
        progress: endpointProgress,
        reviewProgress: endpointReviewProgress,
      });
    // ACTION ENDPOINTS
    const actionEndpoints: AutoBeInterfaceEndpointDesign[] =
      await orchestrateInterfaceActionEndpoint(ctx, {
        instruction: props.instruction,
        groups: init.groups,
        baseEndpoints: baseEndpoints,
        progress: endpointProgress,
        reviewProgress: endpointReviewProgress,
      });
    const designs: AutoBeInterfaceEndpointDesign[] = [
      ...baseEndpoints,
      ...actionEndpoints,
    ];

    const firstOperations: AutoBeOpenApi.IOperation[] =
      await orchestrateInterfaceOperation(ctx, {
        designs,
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

    // RENAME REQUEST/RESPONSE BODY TYPE NAMES
    const renameProgress: AutoBeProgressEventBase = {
      completed: 0,
      total: 0,
    };
    AutoBeJsonSchemaNamingConvention.normalize({
      operations: document.operations,
      collection: new AutoBeJsonSchemaCollection({}, {}),
    });
    await orchestrateInterfaceSchemaRename(ctx, {
      operations: document.operations,
      progress: renameProgress,
      collection: new AutoBeJsonSchemaCollection({}, {}),
    });

    //------------------------------------------------
    // DTO SCHEMAS
    //------------------------------------------------
    // PREPARE ITERATOR
    const castingProgress: AutoBeProgressEventBase = {
      completed: 0,
      total: 0,
    };
    const reviewProgress: AutoBeProgressEventBase = {
      completed: 0,
      total: 0,
    };
    const iterate = async (
      initialize: () => Promise<
        Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>
      >,
    ) => {
      const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
      const overwrite = async (
        next: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
      ) => {
        for (const [k, v] of Object.entries(next))
          if (v === undefined) delete schemas[k];
        if (Object.keys(schemas).length === 0) return;

        // assign schemas
        const collection: AutoBeJsonSchemaCollection =
          new AutoBeJsonSchemaCollection(document.components.schemas, schemas);
        collection.assign(next);
        collection.assign(
          AutoBeJsonSchemaFactory.presets(new Set(Object.keys(schemas))),
        );

        // special logics for standardization
        AutoBeJsonSchemaNamingConvention.normalize({
          operations: document.operations,
          collection,
        });
        AutoBeJsonSchemaFactory.authorize(document.components.schemas);
        AutoBeJsonSchemaFactory.finalize({
          application: ctx.state().database!.result.data,
          operations: document.operations,
          collection,
        });
        if (Object.keys(schemas).length === 0) return;

        // rename by agent
        await orchestrateInterfaceSchemaRename(ctx, {
          operations: document.operations,
          progress: renameProgress,
          collection,
        });
      };

      // initialize schemas
      await overwrite(await initialize());

      // type casting
      if (Object.keys(schemas).length !== 0)
        await overwrite(
          await orchestrateInterfaceSchemaCasting(ctx, {
            instruction: props.instruction,
            document,
            schemas,
            progress: castingProgress,
          }),
        );

      // review schemas
      reviewProgress.total +=
        Object.keys(schemas).filter(
          (k) =>
            AutoBeJsonSchemaValidator.isPreset(k) === false &&
            AutoBeJsonSchemaValidator.isObjectType({
              operations: document.operations,
              typeName: k,
            }) === true,
        ).length *
          (REVIEWERS.length - 1) +
        Object.keys(schemas).filter((k) =>
          AutoBeInterfaceSchemaReviewProgrammer.filterSecurity({
            document,
            typeName: k,
          }),
        ).length;
      for (const config of REVIEWERS)
        if (Object.keys(schemas).length !== 0)
          await overwrite(
            await orchestrateInterfaceSchemaReview(ctx, config, {
              instruction: props.instruction,
              document,
              schemas,
              progress: reviewProgress,
            }),
          );
    };

    // INITIAL SCHEMAS
    await iterate(() =>
      orchestrateInterfaceSchema(ctx, {
        instruction: props.instruction,
        operations,
      }),
    );

    // COMPLEMENTATION
    const complementProgress: AutoBeProgressEventBase = {
      completed: 0,
      total: 0,
    };
    while (missedOpenApiSchemas(document).length !== 0)
      await iterate(() =>
        orchestrateInterfaceSchemaComplement(ctx, {
          instruction: props.instruction,
          progress: complementProgress,
          document,
        }),
      );

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

    // SPECIFY ACCESSORS
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
