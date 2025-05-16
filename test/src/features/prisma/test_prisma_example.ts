import { AutoBeAgent, orchestrate } from "@autobe/agent";
import { AutoBeState } from "@autobe/agent/src/context/AutoBeState";
import { AutoBeCompiler } from "@autobe/compiler";
import { AutoBeAnalyzeHistory } from "@autobe/interface";
import fs from "fs";
import OpenAI from "openai";
import { v4 } from "uuid";

import { TestGlobal } from "../../TestGlobal";

export const test_prisma_example = async () => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;
  const files: Record<string, string> = await getAnalyzeFiles();
  const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({ apiKey: TestGlobal.env.CHATGPT_API_KEY }),
      model: "gpt-4.1",
    },
    compiler: new AutoBeCompiler(),
  });
  await orchestrate.prisma({
    ...agent.getContext(),
    state: () =>
      ({
        analyze: {
          id: v4(),
          type: "analyze",
          files,
          reason: "",
          description: "",
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          step: 0,
        } satisfies AutoBeAnalyzeHistory,
        prisma: null,
        interface: null,
        test: null,
        realize: null,
      }) satisfies AutoBeState,
  })({
    reason: "just for testing",
  });
};

const getAnalyzeFiles = async (): Promise<Record<string, string>> => {
  const root = `${TestGlobal.ROOT}/examples/analyze`;
  const directory = await fs.promises.readdir(root);
  const record: Record<string, string> = {};
  for (const file of directory) {
    if (file.endsWith(".md") === false) continue;
    record[file] = await fs.promises.readFile(`${root}/${file}`, "utf-8");
  }
  return record;
};
