import { AutoBeOpenApi } from "../openapi";
import { IAutoBePrismaCompiler } from "./IAutoBePrismaCompiler";
import { IAutoBeTypeScriptCompilerProps } from "./IAutoBeTypeScriptCompilerProps";
import { IAutoBeTypeScriptCompilerResult } from "./IAutoBeTypeScriptCompilerResult";

export interface IAutoBeCompiler {
  prisma: IAutoBePrismaCompiler;
  interface(document: AutoBeOpenApi.IDocument): Promise<Record<string, string>>;
  typescript(
    props: IAutoBeTypeScriptCompilerProps,
  ): Promise<IAutoBeTypeScriptCompilerResult>;
}
