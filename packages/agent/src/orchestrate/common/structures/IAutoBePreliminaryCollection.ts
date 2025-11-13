import { AutoBeOpenApi, AutoBePrisma } from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";

export interface IAutoBePreliminaryCollection {
  analysisFiles: AutoBeAnalyzeFile[];
  prismaSchemas: AutoBePrisma.IModel[];
  interfaceOperations: AutoBeOpenApi.IOperation[];
  interfaceSchemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
}
