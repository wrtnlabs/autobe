import { AutoBeOpenApi, AutoBeTest } from "@autobe/interface";
import { HashMap } from "tstl";
import { IValidation } from "typia";

export interface IAutoBeTextValidateContext {
  function: AutoBeTest.IFunction;
  document: AutoBeOpenApi.IDocument;
  endpoints: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
  errors: IValidation.IError[];
}
