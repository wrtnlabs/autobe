import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import cp from "child_process";
import OpenAI from "openai";
import { v4 } from "uuid";

import { TestGlobal } from "../../TestGlobal";
import { TestHistory } from "../../internal/TestHistory";

export const test_compiler_realize_files = async () => {
  if (TestHistory.has("todo", "test") === false) return false;

  const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({ apiKey: "" }),
      model: "gpt-4.1",
    },
    compiler: (listener) => new AutoBeCompiler(listener),
    histories: [
      ...(await TestHistory.getHistories("todo", "test")),
      {
        type: "realize",
        functions: [],
        authorizations: [],
        controllers: {},
        compiled: {
          type: "success",
        },
        id: v4(),
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        reason: "Realize files for compiler",
        step: 0,
      },
    ],
  });

  const files: Record<string, string> = await agent.getFiles();
  const root: string = `${TestGlobal.ROOT}/results/compiler.realize.files`;
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
