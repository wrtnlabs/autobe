import { AutoBeRealizeFunction } from "@autobe/interface";

export interface IAutoBeRealizeFunctionResult<
  RealizeFunction extends AutoBeRealizeFunction,
> {
  success: boolean;
  function: RealizeFunction;
}
