import { AutoBeAgent } from "@autobe/agent";
import { orchestrateAnalyzeSectionReview } from "@autobe/agent/src/orchestrate/analyze/orchestrateAnalyzeSectionReview";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeSectionReviewEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteSectionEvent,
  AutoBeAnalyzeWriteUnitEvent,
  AutoBeExampleProject,
  AutoBeProgressEventBase,
} from "@autobe/interface";

import { validate_analyze_scenario } from "./validate_analyze_scenario";
import { validate_analyze_write_module } from "./validate_analyze_write_module";
import { validate_analyze_write_section } from "./validate_analyze_write_section";
import { validate_analyze_write_unit } from "./validate_analyze_write_unit";

export const validate_analyze_write_section_review = async (props: {
  agent: AutoBeAgent;
  vendor: string;
  project: AutoBeExampleProject;
}): Promise<AutoBeAnalyzeSectionReviewEvent> => {
  const scenario: AutoBeAnalyzeScenarioEvent =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "analyze.scenario.json",
    })) ?? (await validate_analyze_scenario(props));

  const moduleEvent: AutoBeAnalyzeWriteModuleEvent =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "analyze.write_module.json",
    })) ?? (await validate_analyze_write_module(props));

  const unitEvent: AutoBeAnalyzeWriteUnitEvent =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "analyze.write_unit.json",
    })) ?? (await validate_analyze_write_unit(props));

  const sectionEvent: AutoBeAnalyzeWriteSectionEvent =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "analyze.write_section.json",
    })) ?? (await validate_analyze_write_section(props));

  // Use first file from scenario for testing
  const file = scenario.files[0];
  if (!file) throw new Error("No files in scenario");

  const progress: AutoBeProgressEventBase = {
    total: scenario.files.length,
    completed: 0,
  };

  const event: AutoBeAnalyzeSectionReviewEvent =
    await orchestrateAnalyzeSectionReview(props.agent.getContext(), {
      promptCacheKey: "",
      scenario,
      fileIndex: 0,
      file,
      moduleEvent,
      unitEvents: [unitEvent],
      sectionEvents: [[sectionEvent]],
      progress,
      retry: 0,
    });

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["analyze.write_section_review.json"]: JSON.stringify(event),
    },
  });
  return event;
};
