import { IAutoBeTypeScriptCompilerProps } from "./IAutoBeTypeScriptCompilerProps";
import { IAutoBeTypeScriptCompilerResult } from "./IAutoBeTypeScriptCompilerResult";

export interface IAutoBeTypeScriptCompiler {
  compile(
    props: IAutoBeTypeScriptCompilerProps,
  ): Promise<IAutoBeTypeScriptCompilerResult>;
}
