import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";

export interface AutoBePreliminaryAcquisition {
  analysisSections: number[];
  databaseSchemas: string[];
  interfaceOperations: AutoBeOpenApi.IEndpoint[];
  interfaceSchemas: string[];
  realizeCollectors: string[];
  realizeTransformers: string[];

  previousAnalysisSections: number[];
  previousDatabaseSchemas: string[];
  previousInterfaceOperations: AutoBeOpenApi.IEndpoint[];
  previousInterfaceSchemas: string[];

  complete: false;
}
