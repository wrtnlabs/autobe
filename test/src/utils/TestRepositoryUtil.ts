import fs from "fs";

import { TestGlobal } from "../TestGlobal";

export namespace TestRepositoryUtil {
  export const prisma = (project: string): Promise<Record<string, string>> =>
    collect({
      root: `${TestGlobal.ROOT}/assets/repositories/${project}/prisma/schema`,
      prefix: "",
      extension: "prisma",
    });

  export const src = (project: string): Promise<Record<string, string>> =>
    collect({
      root: `${TestGlobal.ROOT}/assets/repositories/${project}/src`,
      prefix: "src/",
      extension: "ts",
    });

  const collect = async (props: {
    root: string;
    prefix: string;
    extension: string;
  }): Promise<Record<string, string>> => {
    const output: Record<string, string> = {};
    const iterate = async (location: string) => {
      const directory: string[] = await fs.promises.readdir(location);
      for (const file of directory) {
        const next: string = `${location}/${file}`;
        const stat: fs.Stats = await fs.promises.stat(next);
        if (stat.isDirectory()) await iterate(next);
        else if (file.endsWith(`.${props.extension}`))
          output[`${props.prefix}${next.substring(props.root.length + 1)}`] =
            await fs.promises.readFile(next, "utf-8");
      }
    };
    await iterate(props.root);
    return output;
  };
}
