import { AutoBeAgent } from "@autobe/agent";
import { AutoBeState } from "@autobe/agent/src/context/AutoBeState";
import { invertOpenApiDocument } from "@autobe/agent/src/factory/invertOpenApiDocument";
import { AutoBeCompiler } from "@autobe/compiler";
import { RepositoryFileSystem } from "@autobe/filesystem";
import {
  AutoBeAnalyzeHistory,
  AutoBeHistory,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
  AutoBePrismaHistory,
  IAutoBePrismaCompilerResult,
} from "@autobe/interface";
import OpenAI from "openai";
import { v4 } from "uuid";

import { TestGlobal } from "../../../TestGlobal";
import { TestFileSystem } from "../../../internal/TestFileSystem";
import { TestHistory } from "../../../internal/TestHistory";

export const prepare_agent_test = async (project: string) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined)
    throw new Error("No OpenAI API key provided");

  const histories: AutoBeHistory[] = await TestHistory.getInterface(project);
  const compiler: AutoBeCompiler = new AutoBeCompiler();
  const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({
        apiKey: TestGlobal.env.CHATGPT_API_KEY,
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

export const prepare_agent_test2 = async (owner: string, project: string) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined)
    throw new Error("No OpenAI API key provided");

  // PREPARE ASSETS
  const analyze: Record<string, string> = await TestFileSystem.analyze(
    owner,
    project,
  );
  const schemas: Record<string, string> = await RepositoryFileSystem.prisma(
    owner,
    project,
  );

  const compiler: AutoBeCompiler = new AutoBeCompiler();
  const prisma: IAutoBePrismaCompilerResult = await compiler.prisma.compile({
    files: await RepositoryFileSystem.prisma(owner, project),
  });
  if (prisma.type !== "success")
    throw new Error("Failed to pass prisma compilation step");

  const document: AutoBeOpenApi.IDocument = invertOpenApiDocument(
    await RepositoryFileSystem.swagger(owner, project),
  );

  const interfaces = await compiler.interface(document);

  const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({ apiKey: TestGlobal.env.CHATGPT_API_KEY }),
      model: "gpt-4.1",
    },
    compiler: new AutoBeCompiler(),
    histories: [
      {
        ...createHistoryProperties(),
        type: "analyze",
        reason: "User requested to analyze the requirements",
        files: analyze,
      } satisfies AutoBeAnalyzeHistory,
      {
        ...createHistoryProperties(),
        type: "prisma",
        reason:
          "Step to the DB schema generation referencing the analysis report",
        description: `DB schema about overall ${project} system`,
        result: {
          success: true,
          data: {
            files: [],
          },
        },
        compiled: {
          type: "success",
          nodeModules: prisma.nodeModules,
          document: prisma.document,
          diagrams: prisma.diagrams,
          schemas,
        },
        schemas,
      } satisfies AutoBePrismaHistory,
      {
        ...createHistoryProperties(),
        type: "interface",
        reason:
          "Step to the interface generation referencing the Prisma schema",
        files: interfaces,
        document: document,
      } satisfies AutoBeInterfaceHistory,
    ],
  });

  return {
    analyze,
    prisma,
    document,
    interface: interfaces,
    agent,
  };
};

const createHistoryProperties = () => ({
  id: v4(),
  created_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  step: 1,
});
