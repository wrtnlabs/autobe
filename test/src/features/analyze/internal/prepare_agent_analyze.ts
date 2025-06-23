import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { AutoBeUserMessageHistory } from "@autobe/interface";
import OpenAI from "openai";
import { v4 } from "uuid";

import { TestGlobal } from "../../../TestGlobal";

export const prepare_agent_analyze = async (
  project: "bbs-backend" | "shopping-backend" | "sns-backend",
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined)
    throw new Error("No OpenAI API key provided");

  const agent = new AutoBeAgent({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({
        apiKey: TestGlobal.env.CHATGPT_API_KEY,
        baseURL: TestGlobal.env.CHATGPT_BASE_URL,
      }),
      model: "gpt-4.1",
    },
    compiler: new AutoBeCompiler(),
    histories: [createHistoryProperties(project)],
    config: {
      locale: "en-us",
    },
  });

  return { agent };
};

const createHistoryProperties = (
  project: "bbs-backend" | "shopping-backend" | "sns-backend",
) =>
  ({
    id: v4(),
    type: "userMessage",
    contents: [
      {
        type: "text",
        text: `Hello, I wanna make an ${project} Article program.`,
      },
    ],
    created_at: new Date().toISOString(),
  }) satisfies AutoBeUserMessageHistory;
