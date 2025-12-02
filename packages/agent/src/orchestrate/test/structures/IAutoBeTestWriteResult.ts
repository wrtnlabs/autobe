import { AutoBeTestWriteFunction } from "@autobe/interface";

import { IAutoBeTestScenarioArtifacts } from "./IAutoBeTestScenarioArtifacts";

export interface IAutoBeTestWriteResult {
  type: "write";
  artifacts: IAutoBeTestScenarioArtifacts;
  function: AutoBeTestWriteFunction;
}
