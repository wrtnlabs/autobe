import { AutoBeAgent } from "@autobe/agent";
import { orchestrateAnalyzeWriteSection } from "@autobe/agent/src/orchestrate/analyze/orchestrateAnalyzeWriteSection";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteSectionEvent,
  AutoBeAnalyzeWriteUnitEvent,
  AutoBeExampleProject,
  AutoBeProgressEventBase,
} from "@autobe/interface";

import { validate_analyze_scenario } from "./validate_analyze_scenario";
import { validate_analyze_write_unit } from "./validate_analyze_write_unit";

export const validate_analyze_write_section = async (props: {
  agent: AutoBeAgent;
  vendor: string;
  project: AutoBeExampleProject;
}): Promise<AutoBeAnalyzeWriteSectionEvent> => {
  const scenario: AutoBeAnalyzeScenarioEvent =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "analyze.scenario.json",
    })) ?? (await validate_analyze_scenario(props));

  const moduleEvent: AutoBeAnalyzeWriteModuleEvent | null =
    await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "analyze.write_module.json",
    });
  if (!moduleEvent)
    throw new Error(
      "analyze.write_module.json not found. Run the full analyze test first.",
    );

  const unitEvent: AutoBeAnalyzeWriteUnitEvent =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "analyze.write_unit.json",
    })) ?? (await validate_analyze_write_unit(props));

  // Use first file from scenario for testing
  const file = scenario.files[0];
  if (!file) throw new Error("No files in scenario");

  const progress: AutoBeProgressEventBase = {
    total: scenario.files.length,
    completed: 0,
  };

  const event: AutoBeAnalyzeWriteSectionEvent =
    await orchestrateAnalyzeWriteSection(props.agent.getContext(), {
      promptCacheKey: "",
      scenario,
      file,
      moduleEvent,
      unitEvent,
      allUnitEvents: [unitEvent],
      moduleIndex: 0,
      unitIndex: 0,
      progress,
      retry: 0,
    });

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["analyze.write_section.json"]: JSON.stringify(event),
    },
  });
  return event;
};
