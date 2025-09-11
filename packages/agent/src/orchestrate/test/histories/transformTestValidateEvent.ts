import { AutoBeTestValidateEvent } from "@autobe/interface";

import { IAutoBeTestFunction } from "../structures/IAutoBeTestFunction";
import { IAutoBeTestScenarioArtifacts } from "../structures/IAutoBeTestScenarioArtifacts";

export const transformTestValidateEvent = (
  event: AutoBeTestValidateEvent,
  artifacts: IAutoBeTestScenarioArtifacts,
): IAutoBeTestFunction => ({
  scenario: event.file.scenario,
  artifacts,
  location: event.file.location,
  script: event.file.content,
});
