import { IAutoBePrismaCompilerProps } from "./IAutoBePrismaCompilerProps";
import { IAutoBePrismaCompilerResult } from "./IAutoBePrismaCompilerResult";
import { IAutoBeTypeScriptCompilerProps } from "./IAutoBeTypeScriptCompilerProps";
import { IAutoBeTypeScriptCompilerResult } from "./IAutoBeTypeScriptCompilerResult";

export interface IAutoBeCompiler {
  prisma(
    props: IAutoBePrismaCompilerProps,
  ): Promise<IAutoBePrismaCompilerResult>;
  typescript(
    props: IAutoBeTypeScriptCompilerProps,
  ): Promise<IAutoBeTypeScriptCompilerResult>;
}
