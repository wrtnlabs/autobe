import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import cp from "child_process";

import { TestGlobal } from "../../TestGlobal";
import { TestHistory } from "../../internal/TestHistory";

export const test_compiler_interface_files = async () => {
  if (TestHistory.has("todo", "interface") === false) return false;

  const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
    model: "chatgpt",
    vendor: TestGlobal.getVendorConfig(),
    histories: await TestHistory.getHistories("todo", "interface"),
    compiler: (listener) => new AutoBeCompiler(listener),
  });

  const files: Record<string, string> = await agent.getFiles();
  const root: string = `${TestGlobal.ROOT}/results/compiler.interface.files`;
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
  execute("pnpm run test --simultaneous 1");
};
