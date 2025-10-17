import { IAutoBePlaygroundReplay } from "@autobe/interface";
import fs from "fs";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";
import { TestHistory } from "../internal/TestHistory";
import { TestProject } from "../structures/TestProject";
import { AutoBePlaygroundReplayComputer } from "./utils/AutoBePlaygroundReplayComputer";
import { AutoBePlaygroundReplayStorage } from "./utils/AutoBePlaygroundReplayStorage";

const SEQUENCE: Record<string, number> = {
  todo: 1,
  bbs: 2,
  reddit: 3,
  shopping: 4,
};

const main = async (): Promise<void> => {
  const collection: IAutoBePlaygroundReplay.Collection = {};
  for (const vendor of await TestHistory.getVendorModels())
    for (const project of typia.misc.literals<TestProject>()) {
      const replay: IAutoBePlaygroundReplay | null =
        await AutoBePlaygroundReplayStorage.get({
          vendor,
          project,
        });
      if (replay === null) continue;

      const summary: IAutoBePlaygroundReplay.ISummary =
        AutoBePlaygroundReplayComputer.summarize(replay);
      collection[vendor] ??= [];
      collection[vendor].push(summary);
    }
  for (const array of Object.values(collection))
    array.sort((x, y) => SEQUENCE[x.project] - SEQUENCE[y.project]);
  await fs.promises.writeFile(
    `${TestGlobal.ROOT}/../website/src/data/replays.json`,
    JSON.stringify(collection),
    "utf8",
  );
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
