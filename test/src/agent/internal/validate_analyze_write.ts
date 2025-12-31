import { AutoBeAgent } from "@autobe/agent";
import { orchestrateAnalyzeWrite } from "@autobe/agent/src/orchestrate/analyze/orchestrateAnalyzeWrite";
import { executeCachedBatch } from "@autobe/agent/src/utils/executeCachedBatch";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteEvent,
  AutoBeExampleProject,
  AutoBeProgressEventBase,
} from "@autobe/interface";

import { validate_analyze_scenario } from "./validate_analyze_scenario";

export const validate_analyze_write = async (props: {
  agent: AutoBeAgent;
  vendor: string;
  project: AutoBeExampleProject;
}): Promise<AutoBeAnalyzeFile[]> => {
  const scenario: AutoBeAnalyzeScenarioEvent =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "analyze.scenario.json",
    })) ?? (await validate_analyze_scenario(props));

  const writeProgress: AutoBeProgressEventBase = {
    total: scenario.files.length,
    completed: 0,
  };
  const fileList: AutoBeAnalyzeFile[] = await executeCachedBatch(
    props.agent.getContext(),
    scenario.files.map((file) => async (promptCacheKey) => {
      const event: AutoBeAnalyzeWriteEvent = await orchestrateAnalyzeWrite(
        props.agent.getContext(),
        {
          scenario,
          file,
          progress: writeProgress,
          promptCacheKey,
        },
      );
      return event.file;
    }),
  );
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      [`analyze.write.json`]: JSON.stringify(fileList),
    },
  });
  return fileList;
};
