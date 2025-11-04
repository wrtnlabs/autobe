import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import cp from "child_process";
import OpenAI from "openai";

import { TestGlobal } from "../../TestGlobal";
import { ArchiveStorage } from "../../archive/utils/ArchiveStorage";

export const test_compiler_test_files = async () => {
  if (
    (await ArchiveStorage.has({
      vendor: TestGlobal.vendorModel,
      project: "todo",
      phase: "test",
    })) === false
  )
    return false;

  const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({ apiKey: "" }),
      model: "gpt-4.1",
    },
    compiler: (listener) => new AutoBeCompiler(listener),
    histories: await ArchiveStorage.getHistories({
      vendor: TestGlobal.vendorModel,
      project: "todo",
      phase: "test",
    }),
  });
  const files: Record<string, string> = await agent.getFiles();
  const root: string = `${TestGlobal.ROOT}/results/compiler.test.files`;
  await FileSystemIterator.save({
    root,
    files: {
      ...files,
      "pnpm-workspace.yaml": "",
    },
  });

  const execute = (command: string) =>
    cp.execSync(command, {
      stdio: "ignore",
      cwd: root,
    });
  execute("pnpm install");
  execute("pnpm run build");
};
