import { AutoBeOpenApi } from "../openapi";

export interface IAutoBeInterfaceCompiler {
  compile(document: AutoBeOpenApi.IDocument): Promise<Record<string, string>>;
}
