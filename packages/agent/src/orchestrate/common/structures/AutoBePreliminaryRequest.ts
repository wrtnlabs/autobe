import { AutoBePreliminaryKind } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "./IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetInterfaceOperations } from "./IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "./IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "./IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "./IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "./IAutoBePreliminaryGetPreviousInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousPrismaSchemas } from "./IAutoBePreliminaryGetPreviousPrismaSchemas";
import { IAutoBePreliminaryGetPrismaSchemas } from "./IAutoBePreliminaryGetPrismaSchemas";
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
  prismaSchemas: IAutoBePreliminaryGetPrismaSchemas;
  interfaceOperations: IAutoBePreliminaryGetInterfaceOperations;
  interfaceSchemas: IAutoBePreliminaryGetInterfaceSchemas;
  realizeCollectors: IAutoBePreliminaryGetRealizeCollectors;
  realizeTransformers: IAutoBePreliminaryGetRealizeTransformers;
  previousAnalysisFiles: IAutoBePreliminaryGetPreviousAnalysisFiles;
  previousPrismaSchemas: IAutoBePreliminaryGetPreviousPrismaSchemas;
  previousInterfaceSchemas: IAutoBePreliminaryGetPreviousInterfaceSchemas;
  previousInterfaceOperations: IAutoBePreliminaryGetPreviousInterfaceOperations;
};
