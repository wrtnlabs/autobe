import {
  AutoBeTestAuthorizeFunction,
  AutoBeTestGenerateFunction,
  AutoBeTestOperationFunction,
  AutoBeTestPrepareFunction,
} from "@autobe/interface";

import { IAutoBeTestScenarioArtifacts } from "./IAutoBeTestScenarioArtifacts";

export interface IAutoBeTestOperationProcedure {
  type: "operation";
  artifacts: IAutoBeTestScenarioArtifacts;
  function: AutoBeTestOperationFunction;
  prepareFunctions: AutoBeTestPrepareFunction[];
  generateFunctions: AutoBeTestGenerateFunction[];
  authorizeFunctions: AutoBeTestAuthorizeFunction[];
}
