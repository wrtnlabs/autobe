import { AutoBeAgent, orchestrate } from "@autobe/agent";
import { AutoBeState } from "@autobe/agent/src/context/AutoBeState";
import { AutoBeCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeAnalyzeHistory } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import OpenAI from "openai";
import { v4 } from "uuid";

import { TestGlobal } from "../../TestGlobal";

export const test_prisma_example = async () => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;
  const files: Record<string, string> = await FileSystemIterator.read({
    root: `${TestGlobal.ROOT}/assets/shopping/docs/requirements`,
    extension: "md",
    prefix: "",
  });
  const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({ apiKey: TestGlobal.env.CHATGPT_API_KEY }),
      model: "gpt-4.1",
    },
    compiler: new AutoBeCompiler(),
  });
  const response = await orchestrate.prisma({
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

  console.log(JSON.stringify(response, null, 2));

  if (response.type === "prisma") {
    console.log("prisma");
    if (response.result.type === "success") {
      console.log("success");
      const files = response.result.schemas;

      for (const [filename, content] of Object.entries(files)) {
        if (filename === "schema.prisma") {
          const schemaPrisma = await fs.promises.readFile(
            `${TestGlobal.ROOT}/../packages/agent/src/prisma/examples/schema.prisma`,
            "utf-8",
          );
          TestValidator.equals("schema.prisma content")(content)(schemaPrisma);

          return response;
        }
      }
    }
  }

  throw new Error("Failed to test_prisma_example");
};
