import { CompressUtil } from "@autobe/filesystem";
import {
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBePhase,
  IAutoBePlaygroundReplay,
} from "@autobe/interface";
import { AutoBePlaygroundReplayUtil } from "@autobe/utils";
import fs from "fs";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";
import { TestProject } from "../structures/TestProject";

const SEQUENCE: Record<string, number> = {
  todo: 1,
  reddit: 2,
  bbs: 3,
  shopping: 4,
};

const collect = async (props: {
  vendor: string;
  project: TestProject;
}): Promise<IAutoBePlaygroundReplay.ISummary | null> => {
  const phase: AutoBePhase | undefined = (
    ["realize", "test", "interface", "prisma", "analyze"] as const
  ).find(
    (k) =>
      fs.existsSync(
        `${TestGlobal.ROOT}/assets/histories/${props.vendor}/${props.project}.${k}.json.gz`,
      ) === true,
  );
  if (phase === undefined) return null;

  const histories: AutoBeHistory[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${TestGlobal.ROOT}/assets/histories/${props.vendor}/${props.project}.${phase}.json.gz`,
      ),
    ),
  );
  const snapshots: AutoBeEventSnapshot[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${TestGlobal.ROOT}/assets/histories/${props.vendor}/${props.project}.${phase}.snapshots.json.gz`,
      ),
    ),
  );
  return AutoBePlaygroundReplayUtil.summarize({
    vendor: props.vendor,
    project: props.project,
    histories,
    tokenUsage: snapshots.at(-1)!.tokenUsage,
  });
};

const main = async (): Promise<void> => {
  const collection: IAutoBePlaygroundReplay.Collection = {};
  for (const vendor of [
    "openai/gpt-4.1",
    "openai/gpt-4.1-mini",
    "qwen/qwen3-next-80b-a3b-instruct",
  ])
    for (const project of typia.misc.literals<TestProject>()) {
      const replay: IAutoBePlaygroundReplay.ISummary | null = await collect({
        vendor,
        project,
      });
      if (replay === null) continue;

      collection[vendor] ??= [];
      collection[vendor].push(replay);
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
