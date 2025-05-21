import { AutoBeAgent, orchestrate } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { FileSystemIterator, TestRepositoryUtil } from "@autobe/filesystem";
import {
  AutoBeAnalyzeHistory,
  AutoBeAssistantMessageHistory,
  AutoBeInterfaceHistory,
  AutoBePrismaHistory,
  IAutoBePrismaCompilerResult,
} from "@autobe/interface";
import fs from "fs";
import OpenAI from "openai";
import { v4 } from "uuid";

import { TestGlobal } from "../../TestGlobal";

export const test_agent_interface_main_bbs = async () => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const analyzeFiles: Record<string, string> = {
    "index.md": await fs.promises.readFile(
      `${TestGlobal.ROOT}/assets/bbs/docs/requirements/index.md`,
      "utf8",
    ),
  };
  const prismaFiles: Record<string, string> = await TestRepositoryUtil.prisma(
    "samchon",
    "bbs-backend",
  );

  // COMPILER PRISMA
  const compiler: AutoBeCompiler = new AutoBeCompiler();
  const prisma: IAutoBePrismaCompilerResult = await compiler.prisma({
    files: prismaFiles,
  });
  if (prisma.type !== "success")
    throw new Error("Failed to pass prisma generate");

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
        description: "Analysis report about overall e-commerce system",
        files: analyzeFiles,
      } satisfies AutoBeAnalyzeHistory,
      {
        ...createHistoryProperties(),
        type: "prisma",
        reason:
          "Step to the DB schema generation referencing the analysis report",
        description: "DB schema about overall e-commerce system",
        result: {
          type: "success",
          schemas: prisma.schemas,
          nodeModules: prisma.nodeModules,
          document: prisma.document,
          diagrams: prisma.diagrams,
        },
      } satisfies AutoBePrismaHistory,
    ],
  });

  // GENERATE INTERFACE
  const result: AutoBeInterfaceHistory | AutoBeAssistantMessageHistory =
    await orchestrate.interface(agent.getContext())({
      reason: "Step to the interface designing after DB schema generation",
    });
  if (result.type !== "interface")
    throw new Error("History type must be interface.");

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/bbs/interface`,
    files: {
      ...agent.getFiles(),
      "logs/result.json": JSON.stringify(result, null, 2),
      "logs/tokenUsage.json": JSON.stringify(agent.getTokenUsage(), null, 2),
    },
  });
};

const createHistoryProperties = () => ({
  id: v4(),
  started_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  step: 1,
});
