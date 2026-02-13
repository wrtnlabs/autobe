import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import { writePrismaApplication } from "@autobe/utils";

import { TestGlobal } from "../TestGlobal";

const main = async (): Promise<void> => {
  const histories = await AutoBeExampleStorage.getHistories({
    vendor: "qwen/qwen3-coder-next",
    project: "bbs",
    phase: "database",
  });
  const database = histories.find((h) => h.type === "database");
  if (database === undefined) throw new Error("Database history not found");

  const files: Record<string, string> = writePrismaApplication({
    dbms: "postgres",
    application: database.result.data,
  });
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/prisma`,
    files,
  });
};
main().catch(console.error);
