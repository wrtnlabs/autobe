import {
  AutoBeExampleStorage,
  AutoBeReplayComputer,
  AutoBeReplayStorage,
} from "@autobe/benchmark";
import {
  IAutoBePlaygroundBenchmark,
  IAutoBePlaygroundReplay,
} from "@autobe/interface";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";

const LOCATION = `${TestGlobal.ROOT}/../website/src/data/benchmark.json`;

const main = async (): Promise<void> => {
  const experiments: IAutoBePlaygroundBenchmark[] =
    fs.existsSync(LOCATION) === false ||
    process.argv.includes("--reset") === true
      ? []
      : JSON.parse(await fs.promises.readFile(LOCATION, "utf8"));
  for (const vendor of await AutoBeExampleStorage.getVendorModels()) {
    const previous: IAutoBePlaygroundBenchmark | undefined = experiments.find(
      (experiment) => experiment.vendor === vendor,
    );
    const summaries: IAutoBePlaygroundReplay.ISummary[] =
      await AutoBeReplayStorage.getAllSummaries(vendor);
    if (previous !== undefined) {
      for (const x of summaries) {
        const existing: IAutoBePlaygroundReplay.ISummary | undefined =
          previous.replays.find((r) => r.project === x.project);
        if (existing !== undefined) Object.assign(existing, x);
        else previous.replays.push(x);
      }
      previous.score = AutoBeReplayComputer.score(previous.replays);
      previous.emoji = AutoBeReplayComputer.emoji(previous.replays);
    } else {
      const benchmark: IAutoBePlaygroundBenchmark = {
        vendor,
        replays: summaries,
        score: AutoBeReplayComputer.score(summaries),
        emoji: AutoBeReplayComputer.emoji(summaries),
      };
      experiments.push(benchmark);
    }
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
