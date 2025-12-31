import { AutoBeAgent } from "@autobe/agent";
import { orchestrateAnalyzeReview } from "@autobe/agent/src/orchestrate/analyze/orchestrateAnalyzeReview";
import { executeCachedBatch } from "@autobe/agent/src/utils/executeCachedBatch";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeReviewEvent,
  AutoBeAnalyzeScenarioEvent,
  AutoBeExampleProject,
  AutoBeProgressEventBase,
} from "@autobe/interface";

import { validate_analyze_scenario } from "./validate_analyze_scenario";
import { validate_analyze_write } from "./validate_analyze_write";

export const validate_analyze_review = async (props: {
  agent: AutoBeAgent;
  vendor: string;
  project: AutoBeExampleProject;
}): Promise<void> => {
  const scenario: AutoBeAnalyzeScenarioEvent =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "analyze.scenario.json",
    })) ?? (await validate_analyze_scenario(props));
  const writeFiles: AutoBeAnalyzeFile[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "analyze.write.json",
    })) ?? (await validate_analyze_write(props));

  const progress: AutoBeProgressEventBase = {
    total: writeFiles.length,
    completed: 0,
  };
  const newFiles: AutoBeAnalyzeFile[] = await executeCachedBatch(
    props.agent.getContext(),
    writeFiles.map((file) => async (promptCacheKey) => {
      try {
        const event: AutoBeAnalyzeReviewEvent = await orchestrateAnalyzeReview(
          props.agent.getContext(),
          {
            scenario,
            allFiles: writeFiles, // all files
            myFile: file,
            progress,
            promptCacheKey,
          },
        );
        return {
          ...event.file,
          content: event.content,
        };
      } catch {
        return file;
      }
    }),
  );
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      [`analyze.review.json`]: JSON.stringify(newFiles),
    },
  });
};
