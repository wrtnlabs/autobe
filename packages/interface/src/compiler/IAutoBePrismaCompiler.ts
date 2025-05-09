import { IAutoBePrismaCompilerProps } from "./IAutoBePrismaCompilerProps";
import { IAutoBePrismaCompilerResult } from "./IAutoBePrismaCompilerResult";

export interface IAutoBePrismaCompiler {
  compile(
    props: IAutoBePrismaCompilerProps,
  ): Promise<IAutoBePrismaCompilerResult>;
}
