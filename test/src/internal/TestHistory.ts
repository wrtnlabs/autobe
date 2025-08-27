import { AutoBeTokenUsage } from "@autobe/agent";
import { CompressUtil } from "@autobe/filesystem";
import {
  AutoBeEventSnapshot,
  AutoBeHistory,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import fs from "fs";
import typia from "typia";
import { v7 } from "uuid";

import { TestGlobal } from "../TestGlobal";
import { TestProject } from "../structures/TestProject";
import { TestFileSystem } from "./TestFileSystem";

export namespace TestHistory {
  export const save = async (files: Record<string, string>): Promise<void> => {
    await TestFileSystem.save({
      root: `${TestGlobal.ROOT}/assets/histories/${TestGlobal.getVendorModel()}`,
      overwrite: true,
      files,
    });
  };

  export const initial = async (
    project: TestProject,
  ): Promise<AutoBeHistory[]> => {
    const text: string = await fs.promises.readFile(
      `${TestGlobal.ROOT}/scripts/${project}.md`,
      "utf8",
    );
    return [
      {
        type: "userMessage",
        id: v7(),
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

  export const getHistories = async (
    project: TestProject,
    type: "analyze" | "prisma" | "interface" | "test" | "realize",
  ): Promise<AutoBeHistory[]> => {
    const location: string = `${TestGlobal.ROOT}/assets/histories/${TestGlobal.getVendorModel()}/${project}.${type}.json.gz`;
    const content: string = await CompressUtil.gunzip(
      await fs.promises.readFile(location),
    );
    const histories: AutoBeHistory[] = JSON.parse(content);
    console.log(histories.filter((h) => h.type === "test").at(0)?.compiled);
    return typia.assert(histories);
  };

  export const getTokenUsage = async (
    project: TestProject,
    type: "analyze" | "prisma" | "interface" | "test" | "realize",
  ): Promise<IAutoBeTokenUsageJson> => {
    const snapshots: AutoBeEventSnapshot[] = JSON.parse(
      await CompressUtil.gunzip(
        await fs.promises.readFile(
          `${TestGlobal.ROOT}/assets/histories/${TestGlobal.getVendorModel()}/${project}.${type}.snapshots.json.gz`,
        ),
      ),
    );
    return snapshots.at(-1)?.tokenUsage ?? new AutoBeTokenUsage().toJSON();
  };

  export const has = (
    project: TestProject,
    type: "analyze" | "prisma" | "interface" | "test" | "realize",
  ): boolean =>
    fs.existsSync(
      `${TestGlobal.ROOT}/assets/histories/${TestGlobal.getVendorModel()}/${project}.${type}.json.gz`,
    );
}
