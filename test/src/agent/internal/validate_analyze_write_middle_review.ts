import { AutoBeAgent } from "@autobe/agent";
import { orchestrateAnalyzeWriteMiddleReview } from "@autobe/agent/src/orchestrate/analyze/orchestrateAnalyzeWriteMiddleReview";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteMajorEvent,
  AutoBeAnalyzeWriteMiddleEvent,
  AutoBeAnalyzeWriteMiddleReviewEvent,
  AutoBeExampleProject,
  AutoBeProgressEventBase,
} from "@autobe/interface";

import { validate_analyze_scenario } from "./validate_analyze_scenario";
import { validate_analyze_write_major } from "./validate_analyze_write_major";
import { validate_analyze_write_middle } from "./validate_analyze_write_middle";

export const validate_analyze_write_middle_review = async (props: {
  agent: AutoBeAgent;
  vendor: string;
  project: AutoBeExampleProject;
}): Promise<AutoBeAnalyzeWriteMiddleReviewEvent> => {
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

  const middleEvent: AutoBeAnalyzeWriteMiddleEvent =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "analyze.write_middle.json",
    })) ?? (await validate_analyze_write_middle(props));

  // Use first file from scenario for testing
  const file = scenario.files[0];
  if (!file) throw new Error("No files in scenario");

  const progress: AutoBeProgressEventBase = {
    total: scenario.files.length,
    completed: 0,
  };

  const event: AutoBeAnalyzeWriteMiddleReviewEvent =
    await orchestrateAnalyzeWriteMiddleReview(props.agent.getContext(), {
      scenario,
      file,
      majorEvent,
      middleEvent,
      progress,
      promptCacheKey: "validate_analyze_write_middle_review",
    });

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["analyze.write_middle_review.json"]: JSON.stringify(event),
    },
  });
  return event;
};
