import { AutoBeOpenApi } from "@autobe/interface";

export interface IAutoBeTestArtifacts {
  document: AutoBeOpenApi.IDocument;
  sdk: Record<string, string>;
  dto: Record<string, string>;
  e2e: Record<string, string>;
}
