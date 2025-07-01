import { AutoBeTestFile } from "@autobe/interface";

import { IAutoBeTestScenarioArtifacts } from "./IAutoBeTestScenarioArtifacts";

export interface IAutoBeTestWriteResult {
  artifacts: IAutoBeTestScenarioArtifacts;
  file: AutoBeTestFile;
}
