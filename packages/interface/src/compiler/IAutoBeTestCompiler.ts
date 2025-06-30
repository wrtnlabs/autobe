import { IAutoBeTestCompilerProps } from "./IAutoBeTestCompilerProps";

export interface IAutoBeTestCompiler {
  compile(props: IAutoBeTestCompilerProps): Promise<string>;
}
