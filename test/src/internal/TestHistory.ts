import { AutoBeTokenUsage } from "@autobe/agent";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventSnapshot,
  AutoBeHistory,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import fs from "fs";
import typia from "typia";
import { v4 } from "uuid";

import { TestGlobal } from "../TestGlobal";
import { TestProject } from "../structures/TestProject";

export namespace TestHistory {
  export const save = async (files: Record<string, string>): Promise<void> => {
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/assets/histories/${TestGlobal.getVendorModel()}`,
      overwrite: true,
      files,
    });
  };

  export const getInitial = async (
    project: TestProject,
  ): Promise<AutoBeHistory[]> => {
    const text: string = await fs.promises.readFile(
      `${TestGlobal.ROOT}/scripts/${project}.md`,
      "utf8",
    );
    return [
      {
        type: "userMessage",
        id: v4(),
        created_at: new Date().toISOString(),
        contents: [
          {
            type: "text",
            text,
          },
        ],
      },
    ];
  };

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
        `${TestGlobal.ROOT}/assets/histories/${TestGlobal.getVendorModel()}/${props.project}.${props.type}.json`,
        "utf8",
      ),
    );
    return snapshots.at(-1)?.tokenUsage ?? new AutoBeTokenUsage().toJSON();
  };

  const getHistories = async (props: {
    project: TestProject;
    type: "initial" | "analyze" | "prisma" | "interface" | "test" | "realize";
  }): Promise<AutoBeHistory[]> => {
    const location: string = `${TestGlobal.ROOT}/assets/histories/${TestGlobal.getVendorModel()}/${props.project}.${props.type}.json`;
    const content: string = await fs.promises.readFile(location, "utf8");
    const histories: AutoBeHistory[] = JSON.parse(content);
    return typia.assert(histories);
  };
}
