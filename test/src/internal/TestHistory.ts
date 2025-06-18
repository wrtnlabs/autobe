import { AutoBeHistory } from "@autobe/interface";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";

export namespace TestHistory {
  export const getAnalyze = (
    project: "bbs-backend" | "shopping-backend",
  ): Promise<AutoBeHistory[]> =>
    getHistories({
      project,
      type: "analyze",
    });

  export const getPrisma = (
    project: "bbs-backend" | "shopping-backend",
  ): Promise<AutoBeHistory[]> =>
    getHistories({
      project,
      type: "prisma",
    });

  export const getInterface = (
    project: "bbs-backend" | "shopping-backend",
  ): Promise<AutoBeHistory[]> =>
    getHistories({
      project,
      type: "interface",
    });

  const getHistories = async (props: {
    project: "bbs-backend" | "shopping-backend";
    type: "analyze" | "prisma" | "interface";
  }): Promise<AutoBeHistory[]> => {
    const location: string = `${TestGlobal.ROOT}/assets/histories/${props.project}.${props.type}.json`;
    const content: string = await fs.promises.readFile(location, "utf8");
    return JSON.parse(content);
  };
}
