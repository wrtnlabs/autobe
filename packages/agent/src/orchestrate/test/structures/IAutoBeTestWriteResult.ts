import {
  AutoBeTestAuthorizationWriteFunction,
  AutoBeTestGenerationWriteFunction,
  AutoBeTestPrepareWriteFunction,
  AutoBeTestWriteFunction,
} from "@autobe/interface";

import { IAutoBeTestScenarioArtifacts } from "./IAutoBeTestScenarioArtifacts";

export interface IAutoBeTestWriteResult {
  type: "write";
  artifacts: IAutoBeTestScenarioArtifacts;
  function: AutoBeTestWriteFunction;
  prepareFunctions: AutoBeTestPrepareWriteFunction[];
  generationFunctions: AutoBeTestGenerationWriteFunction[];
  authorizationFunctions: AutoBeTestAuthorizationWriteFunction[];
}
