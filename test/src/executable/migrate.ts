import { CompressUtil } from "@autobe/filesystem";
import {
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBePhase,
} from "@autobe/interface";
import fs from "fs";
import { Singleton } from "tstl";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";
import { ArchiveStorage } from "../archive/utils/ArchiveStorage";
import { TestProject } from "../structures/TestProject";

const migrate = async (props: {
  project: TestProject;
  vendor: string;
}): Promise<void> => {
  const mkdir = new Singleton(async () => {
    const location: string = ArchiveStorage.getDirectory(props);
    try {
      await fs.promises.mkdir(location, { recursive: true });
    } catch {}
    return location;
  });
  const read = async <T>(location: string): Promise<T> =>
    JSON.parse(await CompressUtil.gunzip(await fs.promises.readFile(location)));
  const histories = async (phase: AutoBePhase): Promise<void> => {
    const data: AutoBeHistory[] = await read(
      `${TestGlobal.ROOT}/assets/histories/${props.vendor}/${props.project}.${phase}.json.gz`,
    );
    await fs.promises.writeFile(
      `${await mkdir.get()}/${phase}.histories.json.gz`,
      await CompressUtil.gzip(JSON.stringify(data)),
    );
  };
  const snapshots = async (phase: AutoBePhase): Promise<void> => {
    const snapshots: AutoBeEventSnapshot[] = await read(
      `${TestGlobal.ROOT}/assets/histories/${props.vendor}/${props.project}.${phase}.snapshots.json.gz`,
    );
    await fs.promises.writeFile(
      `${await mkdir.get()}/${phase}.snapshots.json.gz`,
      await CompressUtil.gzip(JSON.stringify(snapshots)),
    );
  };
  console.log(props.vendor, props.project);
  for (const phase of typia.misc.literals<AutoBePhase>()) {
    try {
      await histories(phase);
      await snapshots(phase);
      console.log(` - ${phase}`);
    } catch {}
  }
};

const iterate = async (location: string): Promise<void> => {
  for (const vendor of await fs.promises.readdir(location))
    for (const model of await fs.promises.readdir(`${location}/${vendor}`))
      for (const project of typia.misc.literals<TestProject>())
        await migrate({
          vendor: `${vendor}/${model}`,
          project,
        });
};

const main = async (): Promise<void> => {
  await iterate(`${TestGlobal.ROOT}/assets/histories`);
};
main().catch(console.error);
