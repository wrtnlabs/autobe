import {
  AutoBeDatabase,
  AutoBeOpenApi,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";

import { IAnalysisSectionEntry } from "./IAnalysisSectionEntry";

/** Complete data collection for the preliminary RAG system. */
export interface IAutoBePreliminaryCollection {
  /** Individual ### sections from analysis files for fine-grained retrieval. */
  analysisSections: IAnalysisSectionEntry[];

  /** Database models from DATABASE phase. */
  databaseSchemas: AutoBeDatabase.IModel[];

  /** OpenAPI operations from INTERFACE phase. */
  interfaceOperations: AutoBeOpenApi.IOperation[];

  /** OpenAPI component schemas from INTERFACE phase. */
  interfaceSchemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

  /** Collector functions from REALIZE_COLLECTOR_WRITE phase. */
  realizeCollectors: AutoBeRealizeCollectorFunction[];

  /** Transformer functions from REALIZE_TRANSFORMER_WRITE phase. */
  realizeTransformers: AutoBeRealizeTransformerFunction[];

  /** Analysis sections from previous iteration (for complement). */
  previousAnalysisSections: IAnalysisSectionEntry[];

  /** Database schemas from previous iteration (for complement). */
  previousDatabaseSchemas: AutoBeDatabase.IModel[];

  /** Interface operations from previous iteration (for complement). */
  previousInterfaceOperations: AutoBeOpenApi.IOperation[];

  /** Interface schemas from previous iteration (for complement). */
  previousInterfaceSchemas: Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive
  >;
}
