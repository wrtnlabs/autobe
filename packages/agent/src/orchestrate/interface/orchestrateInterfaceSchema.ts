import { AutoBeOpenApi, AutoBeProgressEventBase } from "@autobe/interface";
import { missedOpenApiSchemas } from "@autobe/utils";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateInterfaceSchemaCasting } from "./orchestrateInterfaceSchemaCasting";
import { orchestrateInterfaceSchemaComplement } from "./orchestrateInterfaceSchemaComplement";
import { orchestrateInterfaceSchemaRefine } from "./orchestrateInterfaceSchemaRefine";
import { orchestrateInterfaceSchemaRename } from "./orchestrateInterfaceSchemaRename";
import { orchestrateInterfaceSchemaReview } from "./orchestrateInterfaceSchemaReview";
import { orchestrateInterfaceSchemaWrite } from "./orchestrateInterfaceSchemaWrite";
import { AutoBeInterfaceSchemaReviewProgrammer } from "./programmers/AutoBeInterfaceSchemaReviewProgrammer";
import { AutoBeJsonSchemaCollection } from "./utils/AutoBeJsonSchemaCollection";
import { AutoBeJsonSchemaFactory } from "./utils/AutoBeJsonSchemaFactory";
import { AutoBeJsonSchemaNamingConvention } from "./utils/AutoBeJsonSchemaNamingConvention";

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
      Object.entries(schemas).filter(([k, v]) =>
        AutoBeInterfaceSchemaReviewProgrammer.filter(k, v),
      ).length * 2;
    for (let i: number = 0; i < 2; i++)
      await overwrite(
        await orchestrateInterfaceSchemaReview(ctx, {
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
