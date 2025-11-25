import { AutoBeTestScenario, AutoBeTestWriteFunction } from "@autobe/interface";

import { IAutoBeTestScenarioArtifacts } from "./IAutoBeTestScenarioArtifacts";

export interface IAutoBeTestWriteResult {
  scenario: AutoBeTestScenario;
  artifacts: IAutoBeTestScenarioArtifacts;
  event: AutoBeTestWriteFunction;
}
