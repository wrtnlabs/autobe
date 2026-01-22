import {
  AutoBeDatabase,
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceEndpointEvent,
  AutoBeInterfaceEndpointRevise,
  AutoBeInterfaceGroup,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { HashMap, Pair } from "tstl";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../structures/IAutoBeOrchestrateHistory";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { orchestrateInterfaceEndpointWrite } from "./orchestrateInterfaceEndpointWrite";

interface IProgrammer {
  kind: AutoBeInterfaceEndpointEvent["kind"];
  history(next: {
    group: AutoBeInterfaceGroup;
    preliminary: AutoBePreliminaryController<
      | "analysisFiles"
      | "databaseSchemas"
      | "previousAnalysisFiles"
      | "previousDatabaseSchemas"
      | "previousInterfaceOperations"
    >;
  }): IAutoBeOrchestrateHistory;
  review(next: {
    group: AutoBeInterfaceGroup;
    designs: AutoBeInterfaceEndpointDesign[];
    promptCacheKey: string;
  }): Promise<AutoBeInterfaceEndpointRevise[]>;
}

export const orchestrateInterfaceEndpointOverall = async (
  ctx: AutoBeContext,
  props: {
    programmer: IProgrammer;
    groups: AutoBeInterfaceGroup[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeInterfaceEndpointDesign[]> => {
  // Build database schema map for stance-based filtering
  const databaseSchemaMap: Map<string, AutoBeDatabase.IModel> = new Map(
    ctx
      .state()
      .database?.result.data.files.flatMap((f) => f.models)
      .map((m) => [m.name, m]) ?? [],
  );

  const matrix: AutoBeInterfaceEndpointDesign[][] = await executeCachedBatch(
    ctx,
    props.groups.map((group) => async (promptCacheKey) => {
      const designs: AutoBeInterfaceEndpointDesign[] =
        await orchestrateInterfaceEndpointWrite(ctx, {
          ...props,
          group,
          promptCacheKey,
        });
      const dict: HashMap<
        AutoBeOpenApi.IEndpoint,
        AutoBeInterfaceEndpointDesign
      > = new HashMap(
        designs.map((c) => new Pair(c.endpoint, c)),
        (e) => AutoBeOpenApiEndpointComparator.hashCode(e),
        (a, b) => AutoBeOpenApiEndpointComparator.equals(a, b),
      );
      try {
        for (const revise of await props.programmer.review({
          group,
          designs,
          promptCacheKey: promptCacheKey + "_review",
        })) {
          if (revise.type === "create")
            dict.set(revise.design.endpoint, {
              endpoint: revise.design.endpoint,
              description: revise.design.description,
              authorizationType: revise.design.authorizationType,
              authorizationActors: revise.design.authorizationActors,
            });
          else if (revise.type === "update") {
            dict.erase(revise.original);
            dict.set(revise.updated.endpoint, {
              endpoint: revise.updated.endpoint,
              description: revise.updated.description,
              authorizationType: revise.updated.authorizationType,
              authorizationActors: revise.updated.authorizationActors,
            });
          } else if (revise.type === "erase") dict.erase(revise.endpoint);
          else revise satisfies never;
        }
      } catch {}
      return dict
        .toJSON()
        .filter(
          (it) =>
            it.second.authorizationType === null ||
            it.second.authorizationType === "management",
        )
        .map((it) => it.second);
    }),
  );

  // Apply stance-based filtering
  const allDesigns = new HashMap(
    matrix.flat().map((d) => new Pair(d.endpoint, d)),
    AutoBeOpenApiEndpointComparator.hashCode,
    AutoBeOpenApiEndpointComparator.equals,
  )
    .toJSON()
    .map((it) => it.second);

  return allDesigns.filter((design) => {
    const relatedSchema = findRelatedDatabaseSchema(
      design.endpoint.path,
      databaseSchemaMap,
    );
    if (!relatedSchema) return true;

    // Session tables: PUT (update) is forbidden
    if (
      relatedSchema.stance === "session" &&
      design.endpoint.method === "put"
    ) {
      return false;
    }

    // Snapshot tables: PUT (update) and DELETE (erase) are forbidden
    if (
      relatedSchema.stance === "snapshot" &&
      (design.endpoint.method === "put" || design.endpoint.method === "delete")
    ) {
      return false;
    }

    return true;
  });
};

/**
 * Find the related database schema for a given endpoint path.
 *
 * This function extracts resource segments from the path and matches them
 * against database schema table names to find the most relevant schema.
 *
 * @param path - The endpoint path (e.g.,
 *   "/members/{memberId}/sessions/{sessionId}")
 * @param schemaMap - Map of database schema names to their models
 * @returns The matched database schema model, or undefined if no match found
 */
const findRelatedDatabaseSchema = (
  path: string,
  schemaMap: Map<string, AutoBeDatabase.IModel>,
): AutoBeDatabase.IModel | undefined => {
  // Extract resource segments from path (excluding parameters like {id})
  const segments = path
    .split("/")
    .filter((s) => s && !s.startsWith("{"))
    .map((s) => s.toLowerCase());

  if (segments.length === 0) return undefined;

  // Get the last resource segment (most specific)
  const lastSegment = segments[segments.length - 1];

  // Try to find a matching schema
  for (const [schemaName, schema] of schemaMap) {
    const normalizedSchemaName = schemaName.toLowerCase();

    // Check if schema name ends with the last segment
    // e.g., "member_sessions" ends with "sessions"
    if (normalizedSchemaName.endsWith(lastSegment)) {
      return schema;
    }

    // Check if schema name contains the last segment as a suffix after underscore
    // e.g., "bbs_article_snapshots" contains "_snapshots"
    if (normalizedSchemaName.endsWith(`_${lastSegment}`)) {
      return schema;
    }
  }

  return undefined;
};
