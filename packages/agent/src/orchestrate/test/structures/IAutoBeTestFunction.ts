import { AutoBeTestScenario } from "@autobe/interface";

import { IAutoBeTestScenarioArtifacts } from "./IAutoBeTestScenarioArtifacts";

export interface IAutoBeTestFunction {
  artifacts: IAutoBeTestScenarioArtifacts;
  scenario: AutoBeTestScenario;
  location: string;
  script: string;
}
