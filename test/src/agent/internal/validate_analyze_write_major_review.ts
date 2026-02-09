import { AutoBeAgent } from "@autobe/agent";
import { orchestrateAnalyzeWriteMajorReview } from "@autobe/agent/src/orchestrate/analyze/orchestrateAnalyzeWriteMajorReview";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteMajorEvent,
  AutoBeAnalyzeWriteMajorReviewEvent,
  AutoBeExampleProject,
  AutoBeProgressEventBase,
} from "@autobe/interface";

import { validate_analyze_scenario } from "./validate_analyze_scenario";
import { validate_analyze_write_major } from "./validate_analyze_write_major";

export const validate_analyze_write_major_review = async (props: {
  agent: AutoBeAgent;
  vendor: string;
  project: AutoBeExampleProject;
}): Promise<AutoBeAnalyzeWriteMajorReviewEvent> => {
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

  const event: AutoBeAnalyzeWriteMajorReviewEvent =
    await orchestrateAnalyzeWriteMajorReview(props.agent.getContext(), {
      scenario,
      file,
      majorEvent,
      progress,
      promptCacheKey: "validate_analyze_write_major_review",
    });

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["analyze.write_major_review.json"]: JSON.stringify(event),
    },
  });
  return event;
};
