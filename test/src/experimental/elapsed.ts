import { AutoBeExampleStorage, AutoBeReplayStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  IAutoBePlaygroundReplay,
} from "@autobe/interface";

const main = async (): Promise<void> => {
  for (const vendor of [
    "qwen/qwen3-coder-next",
    "qwen/qwen3-next-80b-a3b-instruct",
    "qwen/qwen3-30b-a3b-thinking-2507",
  ]) {
    const summaries: IAutoBePlaygroundReplay.ISummary[] =
      await AutoBeReplayStorage.getAllSummaries(vendor);
    for (const summary of summaries)
      await AutoBeExampleStorage.save({
        vendor,
        project: summary.project as AutoBeExampleProject,
        files: {
          ["summary.json"]: JSON.stringify(summary),
        },
      });
  }
};
main().catch(console.error);
