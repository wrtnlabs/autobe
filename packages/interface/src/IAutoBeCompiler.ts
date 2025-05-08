import { IAutoBeCompilerProps } from "./IAutoBeCompilerProps";
import { IAutoBeCompilerResult } from "./IAutoBeCompilerResult";

export interface IAutoBeCompiler {
  compile(props: IAutoBeCompilerProps): Promise<IAutoBeCompilerResult>;
}
