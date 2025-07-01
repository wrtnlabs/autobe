import { AutoBeTestScenario } from "../histories";
import { AutoBeOpenApi } from "../openapi";
import { AutoBeTest } from "../test/AutoBeTest";

export interface IAutoBeTestCompilerProps {
  document: AutoBeOpenApi.IDocument;
  scenario: AutoBeTestScenario;
  function: AutoBeTest.IFunction;
}
