import { OpenApi } from "@samchon/openapi";
import cp from "child_process";
import fs from "fs";
import { VariadicSingleton } from "tstl";

import { FileSystemIterator } from "./FileSystemIterator";

/** @internal */
export namespace RepositoryFileSystem {
  export const analyze = async (
    account: string,
    project: string,
  ): Promise<Record<string, string>> => {
    await fork.get(account, project);
    return FileSystemIterator.read({
      root: `${ROOT}/assets/repositories/${account}/${project}/docs/requirements`,
      extension: "md",
    });
  };

  export const prisma = async (
    account: string,
    project: string,
  ): Promise<Record<string, string>> => {
    await fork.get(account, project);
    const result: Record<string, string> = await FileSystemIterator.read({
      root: `${ROOT}/assets/repositories/${account}/${project}/prisma/schema`,
      extension: "prisma",
    });
    for (const [key, value] of Object.entries(result))
      result[key] = value.replaceAll("@author Samchon", "@author AutoBE");
    return result;
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

  export const swagger = async (
    account: string,
    project: string,
  ): Promise<OpenApi.IDocument> => {
    await fork.get(account, project);
    return OpenApi.convert(
      JSON.parse(
        await fs.promises.readFile(
          `${ROOT}/assets/repositories/${account}/${project}/packages/api/swagger.json`,
          "utf8",
        ),
      ),
    );
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
