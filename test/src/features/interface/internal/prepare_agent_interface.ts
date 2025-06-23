import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { RepositoryFileSystem } from "@autobe/filesystem";
import {
  AutoBeAnalyzeHistory,
  AutoBeOpenApi,
  AutoBePrismaHistory,
  IAutoBePrismaCompilerResult,
} from "@autobe/interface";
import OpenAI from "openai";
import { v4 } from "uuid";

import { TestGlobal } from "../../../TestGlobal";

export const prepare_agent_interface = async (
  owner: string,
  project: string,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined)
    throw new Error("No OpenAI API key provided");

  // PREPARE ASSETS
  const analyze: Record<string, string> = await RepositoryFileSystem.analyze(
    owner,
    project,
  );
  const compiler: AutoBeCompiler = new AutoBeCompiler();
  const schemas: Record<string, string> = await RepositoryFileSystem.prisma(
    owner,
    project,
  );
  const prisma: IAutoBePrismaCompilerResult = await compiler.prisma.compile({
    files: await RepositoryFileSystem.prisma(owner, project),
  });
  if (prisma.type !== "success")
    throw new Error("Failed to pass prisma compilation step");

  const document: AutoBeOpenApi.IDocument = await compiler.interface.invert(
    await RepositoryFileSystem.swagger(owner, project),
  );

  // CONSTRUCT AGENT WITH HISTORIES
  const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({
        apiKey: TestGlobal.env.CHATGPT_API_KEY,
        baseURL: TestGlobal.env.CHATGPT_BASE_URL,
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
        prefix: project,
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
    ],
  });
  return {
    analyze,
    prisma,
    document,
    agent,
  };
};

const createHistoryProperties = () => ({
  id: v4(),
  created_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  step: 1,
});
