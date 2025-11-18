import { AutoBeAgent } from "@autobe/agent";
import { compileRealizeFiles } from "@autobe/agent/src/orchestrate/realize/internal/compileRealizeFiles";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeHistory,
  AutoBeRealizeHistory,
  AutoBeRealizeValidateEvent,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import cp from "child_process";
import OpenAI from "openai";

import { TestGlobal } from "../../TestGlobal";

export const test_compiler_realize_files = async () => {
  if (
    (await AutoBeExampleStorage.has({
      vendor: "openai/gpt-4.1",
      project: "todo",
      phase: "test",
    })) === false
  )
    return false;

  const histories: AutoBeHistory[] = await AutoBeExampleStorage.getHistories({
    vendor: "openai/gpt-4.1",
    project: "todo",
    phase: "realize",
  });
  const realize: AutoBeRealizeHistory | undefined = histories.find(
    (h) => h.type === "realize",
  );
  if (realize?.compiled.type !== "success") return false;

  const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({ apiKey: "" }),
      model: "gpt-4.1",
    },
    compiler: (listener) => new AutoBeCompiler(listener),
    histories,
  });
  const event: AutoBeRealizeValidateEvent = await compileRealizeFiles(
    agent.getContext(),
    {
      authorizations: realize.authorizations,
      functions: realize.functions,
    },
  );
  TestValidator.equals("local compile", event.result.type, "success");

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
