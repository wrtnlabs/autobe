import { IAutoBeRealizeTestProps } from "./IAutoBeRealizeTestProps";
import { IAutoBeRealizeTestResult } from "./IAutoBeRealizeTestResult";

export interface IAutoBeRealizeCompiler {
  test(props: IAutoBeRealizeTestProps): Promise<IAutoBeRealizeTestResult>;
}
