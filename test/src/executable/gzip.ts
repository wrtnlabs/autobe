import { FileSystemIterator } from "@autobe/filesystem";

import { TestGlobal } from "../TestGlobal";
import { TestFileSystem } from "../internal/TestFileSystem";

const main = async (): Promise<void> => {
  const files: Record<string, string> = await FileSystemIterator.read({
    root: `${TestGlobal.ROOT}/assets/histories`,
    extension: "json",
  });
  await TestFileSystem.save({
    root: `${TestGlobal.ROOT}/assets/histories`,
    files,
  });
};
main().catch(console.error);
