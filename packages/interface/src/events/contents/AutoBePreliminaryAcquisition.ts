import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";

export interface AutoBePreliminaryAcquisition {
  analysisFiles: string[];
  analysisSections: number[];
  databaseSchemas: string[];
  interfaceOperations: AutoBeOpenApi.IEndpoint[];
  interfaceSchemas: string[];
  realizeCollectors: string[];
  realizeTransformers: string[];

  previousAnalysisFiles: string[];
  previousAnalysisSections: number[];
  previousDatabaseSchemas: string[];
  previousInterfaceOperations: AutoBeOpenApi.IEndpoint[];
  previousInterfaceSchemas: string[];
}
