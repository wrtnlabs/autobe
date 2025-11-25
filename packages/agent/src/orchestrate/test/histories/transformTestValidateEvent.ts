import { AutoBeTestValidateEvent } from "@autobe/interface";

import { IAutoBeTestFunction } from "../structures/IAutoBeTestFunction";
import { IAutoBeTestScenarioArtifacts } from "../structures/IAutoBeTestScenarioArtifacts";

export const transformTestValidateEvent = (
  event: AutoBeTestValidateEvent,
  artifacts: IAutoBeTestScenarioArtifacts,
): IAutoBeTestFunction => ({
  scenario:
    event.function.kind === "write"
      ? {
          ...event.function.scenario,
          functionName: event.function.functionName,
        }
      : {
          dependencies: [],
          draft: "",
          endpoint: event.function.endpoint,
          functionName: event.function.functionName,
        },
  artifacts,
  location: event.function.location,
  script: event.function.content,
});
