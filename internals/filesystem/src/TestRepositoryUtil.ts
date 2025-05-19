import cp from "child_process";
import fs from "fs";
import { VariadicSingleton } from "tstl";

import { FileSystemIterator } from "./FileSystemIterator";

/**
 * @internal
 */
export namespace TestRepositoryUtil {
  export const prisma = async (
    account: string,
    project: string,
  ): Promise<Record<string, string>> => {
    await fork.get(account, project);
    return FileSystemIterator.read({
      root: `${ROOT}/assets/repositories/${account}/${project}/prisma/schema`,
      prefix: "",
      extension: "prisma",
    });
  };

  export const src = async (
    account: string,
    project: string,
  ): Promise<Record<string, string>> => {
    await fork.get(account, project);
    return FileSystemIterator.read({
      root: `${ROOT}/assets/repositories/${account}/${project}/src`,
      prefix: "src/",
      extension: "ts",
    });
  };

  const fork = new VariadicSingleton(
    async (account: string, project: string): Promise<void> => {
      const location: string = `${ROOT}/assets/repositories/${account}/${project}`;
      if (fs.existsSync(location))
        cp.execSync("git pull", {
          cwd: location,
          stdio: "ignore",
        });
      else {
        try {
          await fs.promises.mkdir(`${ROOT}/assets/repositories/${account}`, {
            recursive: true,
          });
        } catch {}
        cp.execSync(`git clone https://github.com/${account}/${project}`, {
          cwd: `${ROOT}/assets/repositories/${account}`,
          stdio: "ignore",
        });
      }
    },
  );

  const ROOT = `${__dirname}/../../..`;
}
