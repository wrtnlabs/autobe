import { AutoBeAgent } from "@autobe/agent";
import { orchestrateAnalyzeWriteAllUnitReview } from "@autobe/agent/src/orchestrate/analyze/orchestrateAnalyzeWriteAllUnitReview";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteAllUnitReviewEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteUnitEvent,
  AutoBeExampleProject,
  AutoBeProgressEventBase,
} from "@autobe/interface";

import { validate_analyze_scenario } from "./validate_analyze_scenario";
import { validate_analyze_write_module } from "./validate_analyze_write_module";
import { validate_analyze_write_unit } from "./validate_analyze_write_unit";

export const validate_analyze_write_all_unit_review = async (props: {
  agent: AutoBeAgent;
  vendor: string;
  project: AutoBeExampleProject;
}): Promise<AutoBeAnalyzeWriteAllUnitReviewEvent> => {
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

  // Load or generate unit events for all module sections
  const unitEvents: AutoBeAnalyzeWriteUnitEvent[] = [];
  for (let i = 0; i < moduleEvent.moduleSections.length; i++) {
    const unitEvent: AutoBeAnalyzeWriteUnitEvent =
      (await AutoBeExampleStorage.load({
        vendor: props.vendor,
        project: props.project,
        file: `analyze.write_unit.${i}.json`,
      })) ?? (await validate_analyze_write_unit(props));
    unitEvents.push(unitEvent);
  }

  // Use first file from scenario for testing
  const file = scenario.files[0];
  if (!file) throw new Error("No files in scenario");

  const progress: AutoBeProgressEventBase = {
    total: scenario.files.length,
    completed: 0,
  };

  const event: AutoBeAnalyzeWriteAllUnitReviewEvent =
    await orchestrateAnalyzeWriteAllUnitReview(props.agent.getContext(), {
      scenario,
      file,
      moduleEvent,
      unitEvents,
      progress,
      promptCacheKey: "",
      retry: 0,
    });

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["analyze.write_all_unit_review.json"]: JSON.stringify(event),
    },
  });
  return event;
};
