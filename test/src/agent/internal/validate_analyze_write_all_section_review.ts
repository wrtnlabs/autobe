import { AutoBeAgent } from "@autobe/agent";
import { orchestrateAnalyzeWriteAllSectionReview } from "@autobe/agent/src/orchestrate/analyze/orchestrateAnalyzeWriteAllSectionReview";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteAllSectionReviewEvent,
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

export const validate_analyze_write_all_section_review = async (props: {
  agent: AutoBeAgent;
  vendor: string;
  project: AutoBeExampleProject;
}): Promise<AutoBeAnalyzeWriteAllSectionReviewEvent> => {
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

  // Load or generate section events for all units
  const sectionEvents: AutoBeAnalyzeWriteSectionEvent[][] = [];
  for (let moduleIndex = 0; moduleIndex < unitEvents.length; moduleIndex++) {
    const unitEvent = unitEvents[moduleIndex]!;
    const sectionsForModule: AutoBeAnalyzeWriteSectionEvent[] = [];
    for (
      let unitIndex = 0;
      unitIndex < unitEvent.unitSections.length;
      unitIndex++
    ) {
      const sectionEvent: AutoBeAnalyzeWriteSectionEvent =
        (await AutoBeExampleStorage.load({
          vendor: props.vendor,
          project: props.project,
          file: `analyze.write_section.${moduleIndex}.${unitIndex}.json`,
        })) ?? (await validate_analyze_write_section(props));
      sectionsForModule.push(sectionEvent);
    }
    sectionEvents.push(sectionsForModule);
  }

  // Use first file from scenario for testing
  const file = scenario.files[0];
  if (!file) throw new Error("No files in scenario");

  const progress: AutoBeProgressEventBase = {
    total: scenario.files.length,
    completed: 0,
  };

  const event: AutoBeAnalyzeWriteAllSectionReviewEvent =
    await orchestrateAnalyzeWriteAllSectionReview(props.agent.getContext(), {
      scenario,
      file,
      moduleEvent,
      unitEvents,
      sectionEvents,
      progress,
      promptCacheKey: "",
      retry: 0,
    });

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["analyze.write_all_section_review.json"]: JSON.stringify(event),
    },
  });
  return event;
};
