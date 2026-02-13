import {
  AutoBeInterfaceSchemaPropertyErase,
  AutoBeInterfaceSchemaPropertyKeep,
  AutoBeInterfaceSchemaPropertyNullish,
  AutoBeInterfaceSchemaPropertyRevise,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, missedOpenApiSchemas } from "@autobe/utils";
import typia from "typia";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateInterfaceSchemaCasting } from "./orchestrateInterfaceSchemaCasting";
import { orchestrateInterfaceSchemaComplement } from "./orchestrateInterfaceSchemaComplement";
import { orchestrateInterfaceSchemaRefine } from "./orchestrateInterfaceSchemaRefine";
import { orchestrateInterfaceSchemaRename } from "./orchestrateInterfaceSchemaRename";
import { orchestrateInterfaceSchemaReview } from "./orchestrateInterfaceSchemaReview";
import { orchestrateInterfaceSchemaWrite } from "./orchestrateInterfaceSchemaWrite";
import { AutoBeInterfaceSchemaReviewProgrammer } from "./programmers/AutoBeInterfaceSchemaReviewProgrammer";
import { IAutoBeInterfaceSchemaReviewApplication } from "./structures/IAutoBeInterfaceSchemaReviewApplication";
import { IAutoBeInterfaceSchemaReviewConfig } from "./structures/IAutoBeInterfaceSchemaReviewConfig";
import { AutoBeJsonSchemaCollection } from "./utils/AutoBeJsonSchemaCollection";
import { AutoBeJsonSchemaFactory } from "./utils/AutoBeJsonSchemaFactory";
import { AutoBeJsonSchemaNamingConvention } from "./utils/AutoBeJsonSchemaNamingConvention";
import { AutoBeJsonSchemaValidator } from "./utils/AutoBeJsonSchemaValidator";

export const orchestrateInterfaceSchema = async (
  ctx: AutoBeContext,
  props: {
    instruction: string;
    operations: AutoBeOpenApi.IOperation[];
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> => {
  //----
  // PREPARATIONS
  //----
  // MOCK DOCUMENT
  const document: AutoBeOpenApi.IDocument = {
    operations: props.operations,
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

  // PREPARE ITERATOR
  const castingProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: 0,
  };
  const refineProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: 0,
  };
  const reviewProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: 0,
  };

  //----
  // LOGIC FUNCTION
  //----
  const iterate = async (
    initialize: () => Promise<Record<string, AutoBeOpenApi.IJsonSchema>>,
  ) => {
    const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
    const overwrite = async (
      next: Record<
        string,
        AutoBeOpenApi.IJsonSchema | AutoBeOpenApi.IJsonSchemaDescriptive
      >,
    ) => {
      for (const [k, v] of Object.entries(next))
        if (v === undefined) delete next[k];
      if (Object.keys(next).length === 0) return;

      // assign schemas
      const collection: AutoBeJsonSchemaCollection =
        new AutoBeJsonSchemaCollection(document.components.schemas, schemas);
      collection.assign(
        next as Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
      );
      collection.assign(
        AutoBeJsonSchemaFactory.presets(new Set(Object.keys(schemas))),
      );

      // naming convention
      AutoBeJsonSchemaNamingConvention.normalize({
        operations: document.operations,
        collection,
      });
      await orchestrateInterfaceSchemaRename(ctx, {
        operations: document.operations,
        progress: renameProgress,
        collection,
      });

      // special logics
      AutoBeJsonSchemaFactory.fixPaginationSchemas(document.components.schemas);
      AutoBeJsonSchemaFactory.fixAuthorizationSchemas(
        document.components.schemas,
      );
      AutoBeJsonSchemaFactory.finalize({
        application: ctx.state().database!.result.data,
        operations: document.operations,
        collection,
      });
    };

    // initialize schemas
    await overwrite(await initialize());

    // type casting
    await overwrite(
      await orchestrateInterfaceSchemaCasting(ctx, {
        instruction: props.instruction,
        document: {
          operations: document.operations,
          components: {
            authorizations: ctx.state().analyze?.actors ?? [],
            schemas: document.components.schemas,
          },
        },
        schemas,
        progress: castingProgress,
      }),
    );

    // refine schemas
    await overwrite(
      await orchestrateInterfaceSchemaRefine(ctx, {
        instruction: props.instruction,
        document,
        schemas,
        progress: refineProgress,
      }),
    );

    // review schemas
    reviewProgress.total +=
      Object.entries(schemas).filter(
        ([k, v]) =>
          AutoBeJsonSchemaValidator.isPreset(k) === false &&
          AutoBeOpenApiTypeChecker.isObject(v) &&
          Object.keys(v.properties).length !== 0,
      ).length *
        (REVIEWERS.length - 1) +
      Object.keys(schemas).filter((k) =>
        AutoBeInterfaceSchemaReviewProgrammer.filterSecurity({
          document,
          typeName: k,
        }),
      ).length;
    for (const config of REVIEWERS)
      await overwrite(
        await orchestrateInterfaceSchemaReview(ctx, config, {
          instruction: props.instruction,
          document,
          schemas,
          progress: reviewProgress,
        }),
      );
  };

  //----
  // SCHEMA GENERATION LOOP
  //----
  // INITIAL SCHEMAS
  await iterate(() =>
    orchestrateInterfaceSchemaWrite(ctx, {
      instruction: props.instruction,
      operations: document.operations,
    }),
  );

  // COMPLEMENTATION
  const complementProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: 0,
  };
  const failures: Map<string, number> = new Map();
  while (missedOpenApiSchemas(document).length !== 0)
    await iterate(() =>
      orchestrateInterfaceSchemaComplement(ctx, {
        instruction: props.instruction,
        progress: complementProgress,
        failures,
        document,
      }),
    );

  AutoBeJsonSchemaFactory.removeUnused({
    operations: document.operations,
    schemas: document.components.schemas,
  });
  return document.components.schemas;
};

const REVIEWERS: IAutoBeInterfaceSchemaReviewConfig<any>[] = [
  {
    kind: "content",
    systemPrompt: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_CONTENT_REVIEW,
    validate:
      typia.createValidate<
        IAutoBeInterfaceSchemaReviewApplication.IProps<
          Exclude<
            AutoBeInterfaceSchemaPropertyRevise,
            AutoBeInterfaceSchemaPropertyErase
          >
        >
      >(),
    application: (process) =>
      typia.llm.application<
        IAutoBeInterfaceSchemaReviewApplication<
          Exclude<
            AutoBeInterfaceSchemaPropertyRevise,
            AutoBeInterfaceSchemaPropertyErase
          >
        >
      >({
        validate: {
          process,
        },
      }),
    jsonSchema: () =>
      typia.json.application<
        IAutoBeInterfaceSchemaReviewApplication<
          Exclude<
            AutoBeInterfaceSchemaPropertyRevise,
            AutoBeInterfaceSchemaPropertyErase
          >
        >
      >(),
  },
  {
    kind: "relation",
    validate:
      typia.createValidate<
        IAutoBeInterfaceSchemaReviewApplication.IProps<AutoBeInterfaceSchemaPropertyRevise>
      >(),
    systemPrompt: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_RELATION_REVIEW,
    application: (process) =>
      typia.llm.application<
        IAutoBeInterfaceSchemaReviewApplication<AutoBeInterfaceSchemaPropertyRevise>
      >({
        validate: {
          process,
        },
      }),
    jsonSchema: () =>
      typia.json.application<
        IAutoBeInterfaceSchemaReviewApplication<AutoBeInterfaceSchemaPropertyRevise>
      >(),
  },
  {
    kind: "security",
    systemPrompt: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_SECURITY_REVIEW,
    validate:
      typia.createValidate<
        IAutoBeInterfaceSchemaReviewApplication.IProps<AutoBeInterfaceSchemaPropertyRevise>
      >(),
    application: (process) =>
      typia.llm.application<
        IAutoBeInterfaceSchemaReviewApplication<AutoBeInterfaceSchemaPropertyRevise>
      >({
        validate: {
          process,
        },
      }),
    jsonSchema: () =>
      typia.json.application<
        IAutoBeInterfaceSchemaReviewApplication<AutoBeInterfaceSchemaPropertyRevise>
      >(),
  },
  {
    kind: "phantom" as const,
    systemPrompt: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_PHANTOM_REVIEW,
    validate:
      typia.createValidate<
        IAutoBeInterfaceSchemaReviewApplication.IProps<
          | AutoBeInterfaceSchemaPropertyErase
          | AutoBeInterfaceSchemaPropertyKeep
          | AutoBeInterfaceSchemaPropertyNullish
        >
      >(),
    application: (process) =>
      typia.llm.application<
        IAutoBeInterfaceSchemaReviewApplication<
          | AutoBeInterfaceSchemaPropertyErase
          | AutoBeInterfaceSchemaPropertyKeep
          | AutoBeInterfaceSchemaPropertyNullish
        >
      >({
        validate: {
          process,
        },
      }),
    jsonSchema: () =>
      typia.json.application<
        IAutoBeInterfaceSchemaReviewApplication<
          | AutoBeInterfaceSchemaPropertyErase
          | AutoBeInterfaceSchemaPropertyKeep
          | AutoBeInterfaceSchemaPropertyNullish
        >
      >(),
  },
];
