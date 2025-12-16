import {
  AutoBeTestAuthorizationWriteFunction,
  AutoBeTestGenerationWriteFunction,
  AutoBeTestOperationWriteFunction,
  AutoBeTestPrepareWriteFunction,
} from "@autobe/interface";

import { IAutoBeTestScenarioArtifacts } from "./IAutoBeTestScenarioArtifacts";

export interface IAutoBeTestOperationWriteResult {
  type: "operation";
  artifacts: IAutoBeTestScenarioArtifacts;
  function: AutoBeTestOperationWriteFunction;
  prepareFunctions: AutoBeTestPrepareWriteFunction[];
  generationFunctions: AutoBeTestGenerationWriteFunction[];
  authorizationFunctions: AutoBeTestAuthorizationWriteFunction[];
}
