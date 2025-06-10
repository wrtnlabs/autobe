import { FileSystemIterator } from "@autobe/filesystem";

import { TestGlobal } from "../TestGlobal";

export namespace TestFileSystem {
  export const analyze = async (
    account: string,
    project: string,
  ): Promise<Record<string, string>> => {
    return FileSystemIterator.read({
      root: `${TestGlobal.ROOT}/assets/repositories/${account}/${project}/docs/requirements`,
      extension: "md",
    });
  };

  export const prisma = async (
    account: string,
    project: string,
  ): Promise<Record<string, string>> => {
    const result: Record<string, string> = await FileSystemIterator.read({
      root: `${TestGlobal.ROOT}/assets/repositories/${account}/${project}/prisma/schema`,
      extension: "prisma",
    });
    for (const [key, value] of Object.entries(result))
      result[key] = value.replaceAll("@author Samchon", "@author AutoBE");
    return result;
  };
}
