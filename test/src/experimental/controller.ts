import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeRealizeCompiler } from "@autobe/compiler/src/realize/AutoBeRealizeCompiler";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeHistory,
  AutoBeInterfaceHistory,
  AutoBeRealizeHistory,
} from "@autobe/interface";

import { TestGlobal } from "../TestGlobal";

const main = async (): Promise<void> => {
  const histories: AutoBeHistory[] = await AutoBeExampleStorage.getHistories({
    vendor: "qwen/qwen3-next-80b-a3b-instruct",
    project: "todo",
    phase: "realize",
  });
  const compiler: AutoBeRealizeCompiler = new AutoBeRealizeCompiler({
    test: {
      onOperation: async () => {},
      onReset: async () => {},
    },
  });

  const { document }: AutoBeInterfaceHistory = histories.find(
    (h) => h.type === "interface",
  )!;
  const realize: AutoBeRealizeHistory = histories.find(
    (h) => h.type === "realize",
  )!;

  const result: Record<string, string> = await compiler.controller({
    document,
    authorizations: realize.authorizations,
    functions: realize.functions,
  });
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/qwen/qwen3-next-80b-a3b-instruct/todo/realize`,
    files: result,
    overwrite: true,
  });
};
main().catch(console.error);
