import { AutoBeAgent } from "@autobe/agent";
import { orchestratePrismaCorrect } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaCorrect";
import { AutoBeCompiler } from "@autobe/compiler";
import { writePrismaApplication } from "@autobe/compiler/src/prisma/writePrismaApplication";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBePrisma, IAutoBePrismaValidation } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import OpenAI from "openai";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";
import { TestHistory } from "../../internal/TestHistory";
import json from "../compiler/examples/prisma.cross.json";

export const test_agent_prisma_cross = async () => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return;

  const histories = await TestHistory.getAnalyze("bbs");
  const compiler: AutoBeCompiler = new AutoBeCompiler();
  const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({ apiKey: TestGlobal.env.CHATGPT_API_KEY }),
      model: "gpt-4.1",
    },
    histories: histories,
    compiler,
  });
  const result: IAutoBePrismaValidation = await orchestratePrismaCorrect(
    agent.getContext(),
    typia.assert<AutoBePrisma.IApplication>(json),
  );
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/prisma/cross`,
    files: writePrismaApplication(result.data),
  });
  TestValidator.equals("result")(result.success)(true);
};
