import { AutoBeAgent, orchestrate } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { AutoBeUserMessageHistory } from "@autobe/interface";
import OpenAI from "openai";
import { v4 } from "uuid";

import { TestGlobal } from "../../TestGlobal";

export const test_analyze_example = async () => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;
  const agent = new AutoBeAgent({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({ apiKey: TestGlobal.env.CHATGPT_API_KEY }),
      model: "gpt-4.1",
    },
    compiler: new AutoBeCompiler(),
  });
  await orchestrate.analyze({
    ...agent.getContext(),
    histories: () => [
      {
        id: v4(),
        type: "userMessage",
        contents: [
          {
            type: "text",
            text: "Hello, I wanna make an e-commerce program.",
          },
        ],
        created_at: new Date().toISOString(),
      } satisfies AutoBeUserMessageHistory,
    ],
  })({
    reason: "just for testing",
  });
};
