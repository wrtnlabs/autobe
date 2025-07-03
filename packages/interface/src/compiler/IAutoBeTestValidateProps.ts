import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeTest } from "../test/AutoBeTest";

export interface IAutoBeTestValidateProps {
  document: AutoBeOpenApi.IDocument;
  function: AutoBeTest.IFunction;
}
