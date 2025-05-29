import { orchestrate } from "@autobe/agent";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAnalyzeCompleteEvent,
  AutoBeAnalyzeStartEvent,
  AutoBeAssistantMessageHistory,
  AutoBeEvent,
  AutoBeInterfaceHistory,
  AutoBeUserMessageEvent,
} from "@autobe/interface";

import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_main = async (
  owner: string,
  project: string,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent, analyze, prisma } = await prepare_agent_interface(
    owner,
    project,
  );

  // TRACE EVENTS
  const events: AutoBeEvent[] = [
    {
      type: "userMessage",
      contents: [
        {
          type: "text",
          text: "Make shopping mall backend system",
        },
      ],
      created_at: new Date().toISOString(),
    } satisfies AutoBeUserMessageEvent,
    {
      type: "analyzeStart",
      reason: "User requested to make shopping mall backend system",
      step: 0,
      created_at: new Date().toISOString(),
    } satisfies AutoBeAnalyzeStartEvent,
    {
      type: "analyzeComplete",
      files: analyze,
      step: 0,
      created_at: new Date().toISOString(),
    } satisfies AutoBeAnalyzeCompleteEvent,
    {
      type: "prismaStart",
      reason: "Start DB design after requirements analysis",
      step: 0,
      created_at: new Date().toISOString(),
    },
    {
      type: "prismaComplete",
      schemas: prisma.schemas,
      document: prisma.document,
      diagrams: prisma.diagrams,
      step: 0,
      created_at: new Date().toISOString(),
    },
  ];
  const trace = (type: AutoBeEvent.Type) => {
    agent.on(type, (evt) => {
      events.push(evt);
    });
  };
  trace("interfaceStart");
  trace("interfaceEndpoints");
  trace("interfaceOperations");
  trace("interfaceComponents");
  trace("interfaceComplete");

  // REQUEST INTERFACE GENERATION
  let result: AutoBeInterfaceHistory | AutoBeAssistantMessageHistory =
    await orchestrate.interface(agent.getContext())({
      reason: "Step to the interface designing after DB schema generation",
    });
  if (result.type !== "interface") {
    result = await orchestrate.interface(agent.getContext())({
      reason: "Don't ask me to do that, and just do it right now.",
    });
    if (result.type !== "interface")
      throw new Error("History type must be interface.");
  }

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${owner}/${project}/interface/main`,
    files: {
      ...agent.getFiles(),
      "logs/files.json": JSON.stringify(Object.keys(agent.getFiles()), null, 2),
      "logs/result.json": JSON.stringify(result, null, 2),
      "logs/tokenUsage.json": JSON.stringify(agent.getTokenUsage(), null, 2),
      "logs/events.json": JSON.stringify(events, null, 2),
    },
  });
};
