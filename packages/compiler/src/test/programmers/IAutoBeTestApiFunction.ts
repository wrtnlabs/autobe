import { AutoBeOpenApi } from "@autobe/interface";

export interface IAutoBeTestApiFunction {
  operation: AutoBeOpenApi.IOperation;
  accessor: string;
}
