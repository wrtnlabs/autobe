import cp from "child_process";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";

export namespace TestRepositoryUtil {
  export const prisma = async (
    project: string,
  ): Promise<Record<string, string>> => {
    await fork(project);
    return collect({
      root: `${TestGlobal.ROOT}/assets/repositories/${project}/prisma/schema`,
      prefix: "",
      extension: "prisma",
    });
  };

  export const src = async (
    project: string,
  ): Promise<Record<string, string>> => {
    await fork(project);
    return collect({
      root: `${TestGlobal.ROOT}/assets/repositories/${project}/src`,
      prefix: "src/",
      extension: "ts",
    });
  };

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

  const fork = async (name: string): Promise<void> => {
    const location: string = `${TestGlobal.ROOT}/assets/repositories/${name}`;
    if (fs.existsSync(location))
      cp.execSync("git pull", {
        cwd: location,
        stdio: "ignore",
      });
    else {
      try {
        await fs.promises.mkdir(`${TestGlobal.ROOT}/assets/repositories`, {
          recursive: true,
        });
      } catch {}
      cp.execSync(`git clone https://github.com/samchon/${name}`, {
        cwd: `${TestGlobal.ROOT}/assets/repositories`,
        stdio: "ignore",
      });
    }
  };
}
