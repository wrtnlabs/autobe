import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";

export interface AutoBePreliminaryAcquisition {
  analysisFiles: string[];
  databaseSchemas: string[];
  interfaceOperations: AutoBeOpenApi.IEndpoint[];
  interfaceSchemas: string[];
  realizeCollectors: string[];
  realizeTransformers: string[];

  previousAnalysisFiles: string[];
  previousDatabaseSchemas: string[];
  previousInterfaceOperations: AutoBeOpenApi.IEndpoint[];
  previousInterfaceSchemas: string[];
}
