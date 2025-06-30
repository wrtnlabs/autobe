import { IAutoBeTestCompilerProps } from "./IAutoBeTestCompilerProps";

export interface IAutoBeTestCompiler {
  write(props: IAutoBeTestCompilerProps): Promise<string>;
}
