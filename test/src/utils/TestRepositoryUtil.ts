import cp from "child_process";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";
import { FileSystemIterator } from "./FileSystemIterator";

export namespace TestRepositoryUtil {
  export const prisma = async (
    account: string,
    project: string,
  ): Promise<Record<string, string>> => {
    await fork(account, project);
    return FileSystemIterator.read({
      root: `${TestGlobal.ROOT}/assets/repositories/${account}/${project}/prisma/schema`,
      prefix: "",
      extension: "prisma",
    });
  };

  export const src = async (
    account: string,
    project: string,
  ): Promise<Record<string, string>> => {
    await fork(account, project);
    return FileSystemIterator.read({
      root: `${TestGlobal.ROOT}/assets/repositories/${account}/${project}/src`,
      prefix: "src/",
      extension: "ts",
    });
  };

  const fork = async (account: string, project: string): Promise<void> => {
    const location: string = `${TestGlobal.ROOT}/assets/repositories/${account}/${project}`;
    if (fs.existsSync(location))
      cp.execSync("git pull", {
        cwd: location,
        stdio: "ignore",
      });
    else {
      try {
        await fs.promises.mkdir(
          `${TestGlobal.ROOT}/assets/repositories/${account}`,
          {
            recursive: true,
          },
        );
      } catch {}
      cp.execSync(`git clone https://github.com/${account}/${project}`, {
        cwd: `${TestGlobal.ROOT}/assets/repositories/${account}`,
        stdio: "ignore",
      });
    }
  };
}
