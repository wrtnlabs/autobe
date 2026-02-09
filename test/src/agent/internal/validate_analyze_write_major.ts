import { AutoBeAgent } from "@autobe/agent";
import { orchestrateAnalyzeWriteMajor } from "@autobe/agent/src/orchestrate/analyze/orchestrateAnalyzeWriteMajor";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteMajorEvent,
  AutoBeExampleProject,
  AutoBeProgressEventBase,
} from "@autobe/interface";

import { validate_analyze_scenario } from "./validate_analyze_scenario";

export const validate_analyze_write_major = async (props: {
  agent: AutoBeAgent;
  vendor: string;
  project: AutoBeExampleProject;
}): Promise<AutoBeAnalyzeWriteMajorEvent> => {
  const scenario: AutoBeAnalyzeScenarioEvent =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "analyze.scenario.json",
    })) ?? (await validate_analyze_scenario(props));

  // Use first file from scenario for testing
  const file = scenario.files[0];
  if (!file) throw new Error("No files in scenario");

  const progress: AutoBeProgressEventBase = {
    total: scenario.files.length,
    completed: 0,
  };

  const event: AutoBeAnalyzeWriteMajorEvent = await orchestrateAnalyzeWriteMajor(
    props.agent.getContext(),
    {
      scenario,
      file,
      progress,
      promptCacheKey: "validate_analyze_write_major",
    },
  );

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["analyze.write_major.json"]: JSON.stringify(event),
    },
  });
  return event;
};
