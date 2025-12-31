import { AutoBePreliminaryKind } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "./IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetDatabaseSchemas } from "./IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "./IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "./IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "./IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "./IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "./IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "./IAutoBePreliminaryGetPreviousInterfaceSchemas";
import { IAutoBePreliminaryGetRealizeCollectors } from "./IAutoBePreliminaryGetRealizeCollectors";
import { IAutoBePreliminaryGetRealizeTransformers } from "./IAutoBePreliminaryGetRealizeTransformers";

/**
 * Internal function calling schema for preliminary RAG system.
 *
 * Not directly used in LLM function calling, but serves as common structure for
 * preliminary internal orchestration and validation.
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryRequest<Kind extends AutoBePreliminaryKind> {
  /** LLM's reasoning about why this data is needed. */
  thinking: string;

  /** Actual request payload discriminated by `Kind`. */
  request: Mapper[Kind];
}

/** Maps preliminary `Kind` to corresponding request type. */
type Mapper = {
  analysisFiles: IAutoBePreliminaryGetAnalysisFiles;
  databaseSchemas: IAutoBePreliminaryGetDatabaseSchemas;
  interfaceOperations: IAutoBePreliminaryGetInterfaceOperations;
  interfaceSchemas: IAutoBePreliminaryGetInterfaceSchemas;
  realizeCollectors: IAutoBePreliminaryGetRealizeCollectors;
  realizeTransformers: IAutoBePreliminaryGetRealizeTransformers;
  previousAnalysisFiles: IAutoBePreliminaryGetPreviousAnalysisFiles;
  previousDatabaseSchemas: IAutoBePreliminaryGetPreviousDatabaseSchemas;
  previousInterfaceSchemas: IAutoBePreliminaryGetPreviousInterfaceSchemas;
  previousInterfaceOperations: IAutoBePreliminaryGetPreviousInterfaceOperations;
};
