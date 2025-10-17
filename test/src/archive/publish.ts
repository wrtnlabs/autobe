import {
  IAutoBePlaygroundBenchmark,
  IAutoBePlaygroundReplay,
} from "@autobe/interface";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";
import { AutoBePlaygroundReplayComputer } from "./utils/AutoBePlaygroundReplayComputer";
import { AutoBePlaygroundReplayStorage } from "./utils/AutoBePlaygroundReplayStorage";

const main = async (): Promise<void> => {
  const experiments: IAutoBePlaygroundBenchmark[] = [];
  for (const vendor of await AutoBePlaygroundReplayStorage.getVendorModels()) {
    const replayList: IAutoBePlaygroundReplay[] =
      await AutoBePlaygroundReplayStorage.getAll(vendor, (project) =>
        AutoBePlaygroundReplayComputer.SIGNIFICANT_PROJECTS.includes(project),
      );
    if (replayList.length === 0) continue;
    const summaries: IAutoBePlaygroundReplay.ISummary[] = replayList.map(
      AutoBePlaygroundReplayComputer.summarize,
    );
    experiments.push({
      vendor,
      replays: summaries,
      score: AutoBePlaygroundReplayComputer.score(summaries),
      emoji: AutoBePlaygroundReplayComputer.emoji(summaries),
    });
  }
  experiments.sort((a, b) =>
    b.score === a.score
      ? a.vendor.localeCompare(b.vendor)
      : b.score.aggregate - a.score.aggregate,
  );

  await fs.promises.writeFile(
    `${TestGlobal.ROOT}/../website/src/data/benchmark.json`,
    JSON.stringify(experiments),
    "utf8",
  );
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
