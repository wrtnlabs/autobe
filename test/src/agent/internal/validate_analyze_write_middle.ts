import { AutoBeAgent } from "@autobe/agent";
import { orchestrateAnalyzeWriteMiddle } from "@autobe/agent/src/orchestrate/analyze/orchestrateAnalyzeWriteMiddle";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteMajorEvent,
  AutoBeAnalyzeWriteMiddleEvent,
  AutoBeExampleProject,
  AutoBeProgressEventBase,
} from "@autobe/interface";

import { validate_analyze_scenario } from "./validate_analyze_scenario";
import { validate_analyze_write_major } from "./validate_analyze_write_major";

export const validate_analyze_write_middle = async (props: {
  agent: AutoBeAgent;
  vendor: string;
  project: AutoBeExampleProject;
}): Promise<AutoBeAnalyzeWriteMiddleEvent> => {
  const scenario: AutoBeAnalyzeScenarioEvent =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "analyze.scenario.json",
    })) ?? (await validate_analyze_scenario(props));

  const majorEvent: AutoBeAnalyzeWriteMajorEvent =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "analyze.write_major.json",
    })) ?? (await validate_analyze_write_major(props));

  // Use first file from scenario for testing
  const file = scenario.files[0];
  if (!file) throw new Error("No files in scenario");

  const progress: AutoBeProgressEventBase = {
    total: scenario.files.length,
    completed: 0,
  };

  const event: AutoBeAnalyzeWriteMiddleEvent =
    await orchestrateAnalyzeWriteMiddle(props.agent.getContext(), {
      scenario,
      file,
      majorEvent,
      majorIndex: 0,
      progress,
      promptCacheKey: "validate_analyze_write_middle",
    });

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["analyze.write_middle.json"]: JSON.stringify(event),
    },
  });
  return event;
};
