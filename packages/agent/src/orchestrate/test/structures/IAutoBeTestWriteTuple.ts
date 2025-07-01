import { AutoBeTestScenario, AutoBeTestWriteEvent } from "@autobe/interface";

import { IAutoBeTestScenarioArtifacts } from "./IAutoBeTestScenarioArtifacts";

export interface IAutoBeTestWriteTuple {
  scenario: AutoBeTestScenario;
  artifacts: IAutoBeTestScenarioArtifacts;
  event: AutoBeTestWriteEvent;
}
