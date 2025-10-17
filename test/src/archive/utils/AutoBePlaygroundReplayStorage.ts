import { CompressUtil } from "@autobe/filesystem";
import {
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBePhase,
  IAutoBePlaygroundReplay,
} from "@autobe/interface";
import fs from "fs";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";
import { TestProject } from "../../structures/TestProject";

export namespace AutoBePlaygroundReplayStorage {
  export const getVendorModels = async (): Promise<string[]> => {
    const result: string[] = [];
    for (const vendor of await fs.promises.readdir(
      `${TestGlobal.ROOT}/assets/histories`,
    ))
      for (const model of await fs.promises.readdir(
        `${TestGlobal.ROOT}/assets/histories/${vendor}`,
      )) {
        const stat: fs.Stats = await fs.promises.lstat(
          `${TestGlobal.ROOT}/assets/histories/${vendor}/${model}`,
        );
        if (stat.isDirectory() === true) result.push(`${vendor}/${model}`);
      }
    return result.sort();
  };

  export const getAll = async (
    vendor: string,
    projectFilter?: (project: TestProject) => boolean,
  ): Promise<IAutoBePlaygroundReplay[]> => {
    const projects: TestProject[] = typia.misc
      .literals<TestProject>()
      .filter(projectFilter ?? (() => true));
    const replays: Array<IAutoBePlaygroundReplay | null> = await Promise.all(
      projects.map((p) =>
        AutoBePlaygroundReplayStorage.get({
          vendor,
          project: p,
        }),
      ),
    );
    return replays.filter((r) => r !== null);
  };

  export const get = async (props: {
    vendor: string;
    project: TestProject;
  }): Promise<IAutoBePlaygroundReplay | null> => {
    const histories: AutoBeHistory[] | null = await getHistories(props);
    if (histories === null) return null;

    const snapshots = async (
      phase: AutoBePhase,
    ): Promise<AutoBeEventSnapshot[] | null> => {
      const location: string = `${TestGlobal.ROOT}/assets/histories/${props.vendor}/${props.project}.${phase}.snapshots.json.gz`;
      if (fs.existsSync(location) === false) return null;
      return JSON.parse(
        await CompressUtil.gunzip(await fs.promises.readFile(location)),
      );
    };
    return {
      vendor: props.vendor,
      project: props.project,
      histories,
      analyze: await snapshots("analyze"),
      prisma: await snapshots("prisma"),
      interface: await snapshots("interface"),
      test: await snapshots("test"),
      realize: await snapshots("realize"),
    };
  };

  const getHistories = async (props: {
    vendor: string;
    project: TestProject;
  }): Promise<AutoBeHistory[] | null> => {
    for (const phase of SEQUENCE) {
      const location: string = `${TestGlobal.ROOT}/assets/histories/${props.vendor}/${props.project}.${phase}.json.gz`;
      if (fs.existsSync(location) === false) continue;
      return JSON.parse(
        await CompressUtil.gunzip(await fs.promises.readFile(location)),
      ) as AutoBeHistory[];
    }
    return null;
  };
}

const SEQUENCE = ["realize", "test", "interface", "prisma", "analyze"] as const;
