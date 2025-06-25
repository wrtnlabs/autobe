import { orchestrate } from "@autobe/agent";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAssistantMessageHistory,
  AutoBeEvent,
  AutoBeInterfaceHistory,
} from "@autobe/interface";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_main = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent } = await prepare_agent_interface(factory, project);
  const events: AutoBeEvent[] = [];
  const enroll = (event: AutoBeEvent) => {
    events.push(event);
  };
  agent.on("interfaceStart", enroll);
  agent.on("interfaceEndpoints", enroll);
  agent.on("interfaceOperations", enroll);
  agent.on("interfaceComponents", enroll);
  agent.on("interfaceComplement", enroll);
  agent.on("interfaceComplete", enroll);

  // REQUEST INTERFACE GENERATION
  const go = (reason: string) =>
    orchestrate.interface(agent.getContext())({
      reason,
    });
  let result: AutoBeInterfaceHistory | AutoBeAssistantMessageHistory = await go(
    "Step to the interface designing after DB schema generation",
  );
  if (result.type !== "interface") {
    result = await go("Don't ask me to do that, and just do it right now.");
    if (result.type !== "interface")
      throw new Error("History type must be interface.");
  }

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${project}/interface/main`,
    files: {
      ...(await agent.getFiles()),
      "logs/events.json": JSON.stringify(events, null, 2),
      "logs/result.json": JSON.stringify(result, null, 2),
    },
  });
};
