import { AutoBeOpenApi } from "../openapi";
import { IAutoBePrismaCompilerProps } from "./IAutoBePrismaCompilerProps";
import { IAutoBePrismaCompilerResult } from "./IAutoBePrismaCompilerResult";
import { IAutoBeTypeScriptCompilerProps } from "./IAutoBeTypeScriptCompilerProps";
import { IAutoBeTypeScriptCompilerResult } from "./IAutoBeTypeScriptCompilerResult";

export interface IAutoBeCompiler {
  prisma(
    props: IAutoBePrismaCompilerProps,
  ): Promise<IAutoBePrismaCompilerResult>;

  interface(document: AutoBeOpenApi.IDocument): Promise<Record<string, string>>;

  typescript(
    props: IAutoBeTypeScriptCompilerProps,
  ): Promise<IAutoBeTypeScriptCompilerResult>;
}
