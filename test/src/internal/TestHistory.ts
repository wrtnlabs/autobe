import { AutoBeHistory } from "@autobe/interface";
import fs from "fs";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";
import { TestProject } from "../structures/TestProject";

export namespace TestHistory {
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

  const getHistories = async (props: {
    project: TestProject;
    type: "analyze" | "prisma" | "interface" | "test";
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
