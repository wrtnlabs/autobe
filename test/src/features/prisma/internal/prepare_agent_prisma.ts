import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import {
  AutoBeAnalyzeHistory,
  IAutoBePrismaCompilerResult,
} from "@autobe/interface";
import OpenAI from "openai";
import { v4 } from "uuid";

import { TestGlobal } from "../../../TestGlobal";
import { TestFileSystem } from "../../../internal/TestFileSystem";

export const prepare_agent_prisma = async (owner: string, project: string) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined)
    throw new Error("No OpenAI API key provided");

  // PREPARE ASSETS
  const analyze: Record<string, string> = await TestFileSystem.analyze(
    owner,
    project,
  );
  const compiler: AutoBeCompiler = new AutoBeCompiler();
  const prisma: IAutoBePrismaCompilerResult = await compiler.prisma.compile({
    files: await TestFileSystem.prisma(owner, project),
  });
  if (prisma.type !== "success")
    throw new Error("Failed to pass prisma compilation step");

  // CONSTRUCT AGENT WITH HISTORIES
  const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({
        apiKey: TestGlobal.env.CHATGPT_API_KEY,
      }),
      model: "gpt-4.1",
    },
    config: {
      locale: "en-US",
    },
    compiler,
    histories: [
      {
        ...createHistoryProperties(),
        type: "analyze",
        reason: "User requested to analyze the requirements",
        files: analyze,
      } satisfies AutoBeAnalyzeHistory,
    ],
  });
  return {
    analyze,
    prisma,
    agent,
  };
};

const createHistoryProperties = () => ({
  id: v4(),
  created_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  step: 1,
});
