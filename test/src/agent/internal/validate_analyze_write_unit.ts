import { AutoBeAgent } from "@autobe/agent";
import { orchestrateAnalyzeWriteUnit } from "@autobe/agent/src/orchestrate/analyze/orchestrateAnalyzeWriteUnit";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteUnitEvent,
  AutoBeExampleProject,
  AutoBeProgressEventBase,
} from "@autobe/interface";

import { validate_analyze_scenario } from "./validate_analyze_scenario";
import { validate_analyze_write_module } from "./validate_analyze_write_module";

export const validate_analyze_write_unit = async (props: {
  agent: AutoBeAgent;
  vendor: string;
  project: AutoBeExampleProject;
}): Promise<AutoBeAnalyzeWriteUnitEvent> => {
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

  // Use first file from scenario for testing
  const file = scenario.files[0];
  if (!file) throw new Error("No files in scenario");

  const progress: AutoBeProgressEventBase = {
    total: scenario.files.length,
    completed: 0,
  };

  const event: AutoBeAnalyzeWriteUnitEvent = await orchestrateAnalyzeWriteUnit(
    props.agent.getContext(),
    {
      promptCacheKey: "",
      scenario,
      file,
      moduleEvent,
      moduleIndex: 0,
      progress,
      retry: 0,
    },
  );

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["analyze.write_unit.json"]: JSON.stringify(event),
    },
  });
  return event;
};
