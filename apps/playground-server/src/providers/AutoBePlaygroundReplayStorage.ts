import { ArchiveStorage } from "@autobe/filesystem/src/ArchiveStorage";
import {
  AutoBeEventSnapshot,
  AutoBeExampleProject,
  AutoBeHistory,
  AutoBePhase,
  IAutoBePlaygroundReplay,
} from "@autobe/interface";
import typia from "typia";

export namespace AutoBePlaygroundReplayStorage {
  export const getAll = async (
    vendor: string,
    projectFilter?: (project: AutoBeExampleProject) => boolean,
  ): Promise<IAutoBePlaygroundReplay[]> => {
    const projects: AutoBeExampleProject[] = typia.misc
      .literals<AutoBeExampleProject>()
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
    project: AutoBeExampleProject;
  }): Promise<IAutoBePlaygroundReplay | null> => {
    const histories: AutoBeHistory[] | null = await getHistories(props);
    if (histories === null) return null;

    const snapshots = async (
      phase: AutoBePhase,
    ): Promise<AutoBeEventSnapshot[] | null> => {
      try {
        return await ArchiveStorage.getSnapshots({
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
      prisma: await snapshots("prisma"),
      interface: await snapshots("interface"),
      test: await snapshots("test"),
      realize: await snapshots("realize"),
    };
  };

  const getHistories = async (props: {
    vendor: string;
    project: AutoBeExampleProject;
  }): Promise<AutoBeHistory[] | null> => {
    for (const phase of SEQUENCE) {
      try {
        return await ArchiveStorage.getHistories({
          vendor: props.vendor,
          project: props.project,
          phase,
        });
      } catch {}
    }
    return null;
  };
}

const SEQUENCE = ["realize", "test", "interface", "prisma", "analyze"] as const;
