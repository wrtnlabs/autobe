import {
  AutoBeTestAuthorizeWriteFunction,
  AutoBeTestGenerateWriteFunction,
  AutoBeTestOperationWriteFunction,
  AutoBeTestPrepareWriteFunction,
} from "@autobe/interface";

import { IAutoBeTestScenarioArtifacts } from "./IAutoBeTestScenarioArtifacts";

export interface IAutoBeTestOperationWriteResult {
  type: "operation";
  artifacts: IAutoBeTestScenarioArtifacts;
  function: AutoBeTestOperationWriteFunction;
  prepareFunctions: AutoBeTestPrepareWriteFunction[];
  generateFunctions: AutoBeTestGenerateWriteFunction[];
  authorizeFunctions: AutoBeTestAuthorizeWriteFunction[];
}
