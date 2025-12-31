import {
  AutoBeAnalyzeFile,
  AutoBeOpenApi,
  AutoBePrisma,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";

/**
 * Complete data collection for preliminary RAG system.
 *
 * Used in both `all` (globally available) and `local` (currently loaded)
 * contexts of `AutoBePreliminaryController`. Contains current iteration data
 * and optional previous iteration data for complement cycles.
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryCollection {
  /** Requirements analysis files from ANALYZE phase. */
  analysisFiles: AutoBeAnalyzeFile[];

  /** Prisma database models from PRISMA phase. */
  prismaSchemas: AutoBePrisma.IModel[];

  /** OpenAPI operations from INTERFACE phase. */
  interfaceOperations: AutoBeOpenApi.IOperation[];

  /** OpenAPI component schemas from INTERFACE phase. */
  interfaceSchemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

  /** Collector functions from REALIZE_COLLECTOR_WRITE phase. */
  realizeCollectors: AutoBeRealizeCollectorFunction[];

  /** Transformer functions from REALIZE_TRANSFORMER_WRITE phase. */
  realizeTransformers: AutoBeRealizeTransformerFunction[];

  /** Analysis files from previous iteration (for complement). */
  previousAnalysisFiles: AutoBeAnalyzeFile[];

  /** Prisma schemas from previous iteration (for complement). */
  previousPrismaSchemas: AutoBePrisma.IModel[];

  /** Interface operations from previous iteration (for complement). */
  previousInterfaceOperations: AutoBeOpenApi.IOperation[];

  /** Interface schemas from previous iteration (for complement). */
  previousInterfaceSchemas: Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive
  >;
}
