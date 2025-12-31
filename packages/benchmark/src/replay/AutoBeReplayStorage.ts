import { CompressUtil } from "@autobe/filesystem";
import {
  AutoBeEventSnapshot,
  AutoBeExampleProject,
  AutoBeHistory,
  AutoBePhase,
  IAutoBePlaygroundReplay,
} from "@autobe/interface";
import fs from "fs";
import typia from "typia";

import { AutoBeExampleStorage } from "../example/AutoBeExampleStorage";

export namespace AutoBeReplayStorage {
  export const getAll = async (
    vendor: string,
    projectFilter?: (project: AutoBeExampleProject) => boolean,
  ): Promise<IAutoBePlaygroundReplay[]> => {
    const projects: AutoBeExampleProject[] = typia.misc
      .literals<AutoBeExampleProject>()
      .filter(projectFilter ?? (() => true));
    const replays: Array<IAutoBePlaygroundReplay | null> = await Promise.all(
      projects.map((p) =>
        AutoBeReplayStorage.get({
          vendor,
          project: p,
        }),
      ),
    );
    return replays.filter((r) => r !== null);
  };

  export const getAllSummaries = async (
    vendor: string,
    projectFilter?: (project: AutoBeExampleProject) => boolean,
  ): Promise<IAutoBePlaygroundReplay.ISummary[]> => {
    const projects: AutoBeExampleProject[] = typia.misc
      .literals<AutoBeExampleProject>()
      .filter(projectFilter ?? (() => true));
    const summaries: Array<IAutoBePlaygroundReplay.ISummary | null> =
      await Promise.all(
        projects.map((project) =>
          AutoBeReplayStorage.getSummary({ vendor, project }),
        ),
      );
    return summaries.filter((s) => s !== null);
  };

  export const get = async (props: {
    vendor: string;
    project: AutoBeExampleProject;
  }): Promise<IAutoBePlaygroundReplay | null> => {
    const histories: AutoBeHistory[] | null = await getHistories(props);
    if (histories === null) return null;

    const snapshots = async (
      phase: AutoBePhase,
    ): Promise<AutoBeEventSnapshot[] | null> => {
      try {
        return await AutoBeExampleStorage.getSnapshots({
          vendor: props.vendor,
          project: props.project,
          phase,
        });
      } catch {
        return null;
      }
    };
    return {
      vendor: props.vendor,
      project: props.project,
      histories,
      analyze: await snapshots("analyze"),
      database: await snapshots("database"),
      interface: await snapshots("interface"),
      test: await snapshots("test"),
      realize: await snapshots("realize"),
    };
  };

  export const getSummary = async (props: {
    vendor: string;
    project: AutoBeExampleProject;
  }): Promise<IAutoBePlaygroundReplay.ISummary | null> => {
    const location: string = `${AutoBeExampleStorage.getDirectory(props)}/summary.json.gz`;
    if (fs.existsSync(location) === false) return null;
    return JSON.parse(
      await CompressUtil.gunzip(await fs.promises.readFile(location)),
    );
  };

  const getHistories = async (props: {
    vendor: string;
    project: AutoBeExampleProject;
  }): Promise<AutoBeHistory[] | null> => {
    for (const phase of SEQUENCE) {
      try {
        return await AutoBeExampleStorage.getHistories({
          vendor: props.vendor,
          project: props.project,
          phase,
        });
      } catch {}
    }
    return null;
  };
}

const SEQUENCE = [
  "realize",
  "test",
  "interface",
  "database",
  "analyze",
] as const;
