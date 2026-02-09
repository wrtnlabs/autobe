import { AutoBeAgent } from "@autobe/agent";
import { orchestrateAnalyzeWriteMinorReview } from "@autobe/agent/src/orchestrate/analyze/orchestrateAnalyzeWriteMinorReview";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteMajorEvent,
  AutoBeAnalyzeWriteMiddleEvent,
  AutoBeAnalyzeWriteMinorEvent,
  AutoBeAnalyzeWriteMinorReviewEvent,
  AutoBeExampleProject,
  AutoBeProgressEventBase,
} from "@autobe/interface";

import { validate_analyze_scenario } from "./validate_analyze_scenario";
import { validate_analyze_write_major } from "./validate_analyze_write_major";
import { validate_analyze_write_middle } from "./validate_analyze_write_middle";
import { validate_analyze_write_minor } from "./validate_analyze_write_minor";

export const validate_analyze_write_minor_review = async (props: {
  agent: AutoBeAgent;
  vendor: string;
  project: AutoBeExampleProject;
}): Promise<AutoBeAnalyzeWriteMinorReviewEvent> => {
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

  const minorEvent: AutoBeAnalyzeWriteMinorEvent =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "analyze.write_minor.json",
    })) ?? (await validate_analyze_write_minor(props));

  // Use first file from scenario for testing
  const file = scenario.files[0];
  if (!file) throw new Error("No files in scenario");

  const progress: AutoBeProgressEventBase = {
    total: scenario.files.length,
    completed: 0,
  };

  const event: AutoBeAnalyzeWriteMinorReviewEvent =
    await orchestrateAnalyzeWriteMinorReview(props.agent.getContext(), {
      scenario,
      file,
      majorEvent,
      middleEvent,
      minorEvent,
      progress,
      promptCacheKey: "validate_analyze_write_minor_review",
    });

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["analyze.write_minor_review.json"]: JSON.stringify(event),
    },
  });
  return event;
};
