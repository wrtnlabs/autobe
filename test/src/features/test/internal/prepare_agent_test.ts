import { AutoBeAgent } from "@autobe/agent";
import { AutoBeState } from "@autobe/agent/src/context/AutoBeState";
import { AutoBeCompiler } from "@autobe/compiler";
import { AutoBeHistory } from "@autobe/interface";
import OpenAI from "openai";

import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";

export const prepare_agent_test = async (
  project: "bbs-backend" | "shopping-backend",
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined)
    throw new Error("No OpenAI API key provided");

  const histories: AutoBeHistory[] = await TestHistory.getInterface(project);
  const compiler: AutoBeCompiler = new AutoBeCompiler();
  const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({
        apiKey: TestGlobal.env.CHATGPT_API_KEY,
        baseURL: TestGlobal.env.CHATGPT_BASE_URL,
      }),
      model: "gpt-4.1",
      semaphore: 16,
    },
    config: {
      locale: "en-US",
    },
    compiler,
    histories,
  });
  const state: AutoBeState = agent.getContext().state();

  return {
    agent,
    analyze: state.analyze!,
    prisma: state.prisma!,
    interface: state.interface!,
  };
};
