import { AutoBeTokenUsage } from "@autobe/agent";
import {
  AutoBeEventSnapshot,
  AutoBeHistory,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import fs from "fs";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";
import { TestProject } from "../structures/TestProject";

export namespace TestHistory {
  export const getInitial = (project: TestProject): Promise<AutoBeHistory[]> =>
    getHistories({
      project,
      type: "initial",
    });

  export const getAnalyze = (project: TestProject): Promise<AutoBeHistory[]> =>
    getHistories({
      project,
      type: "analyze",
    });

  export const getPrisma = (project: TestProject): Promise<AutoBeHistory[]> =>
    getHistories({
      project,
      type: "prisma",
    });

  export const getInterface = (
    project: TestProject,
  ): Promise<AutoBeHistory[]> =>
    getHistories({
      project,
      type: "interface",
    });

  export const getTest = (project: TestProject) =>
    getHistories({
      project,
      type: "test",
    });

  export const getRealize = (project: TestProject) =>
    getHistories({
      project,
      type: "realize",
    });

  export const getTokenUsage = async (props: {
    project: TestProject;
    type: "analyze" | "prisma" | "interface" | "test" | "realize";
  }): Promise<IAutoBeTokenUsageJson> => {
    const snapshots: AutoBeEventSnapshot[] = JSON.parse(
      await fs.promises.readFile(
        `${TestGlobal.ROOT}/assets/histories/${props.project}.${props.type}.json`,
        "utf8",
      ),
    );
    return snapshots.at(-1)?.tokenUsage ?? new AutoBeTokenUsage().toJSON();
  };

  const getHistories = async (props: {
    project: TestProject;
    type: "initial" | "analyze" | "prisma" | "interface" | "test" | "realize";
  }): Promise<AutoBeHistory[]> => {
    const location: string = `${TestGlobal.ROOT}/assets/histories/${props.project}.${props.type}.json`;
    const content: string = await fs.promises.readFile(location, "utf8");
    const histories: AutoBeHistory[] = JSON.parse(content);

    if (props.type === "test") {
      return typia.assert(
        histories.map((h) => {
          if (h.type === "test") {
            const files = h.files.filter((f) => f.scenario);

            return { ...h, files };
          }
          return h;
        }),
      );
    }

    return typia.assert(histories);
  };
}
