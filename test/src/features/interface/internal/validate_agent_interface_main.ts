import { orchestrate } from "@autobe/agent";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAssistantMessageHistory,
  AutoBeEvent,
  AutoBeEventSnapshot,
  AutoBeInterfaceHistory,
} from "@autobe/interface";
import fs from "fs";

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
  const snapshots: AutoBeEventSnapshot[] = [];
  const listen = (event: AutoBeEvent) => {
    snapshots.push({
      event,
      tokenUsage: agent.getTokenUsage().toJSON(),
    });
  };
  agent.on("interfaceStart", listen);
  agent.on("interfaceEndpoints", listen);
  agent.on("interfaceOperations", listen);
  agent.on("interfaceComponents", listen);
  agent.on("interfaceComplement", listen);
  agent.on("interfaceComplete", listen);

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
      "logs/snapshots.json": JSON.stringify(snapshots),
      "logs/result.json": JSON.stringify(result),
    },
  });
  if (process.argv.includes("--archive")) {
    await fs.promises.writeFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.interface.json`,
      JSON.stringify(agent.getHistories()),
      "utf8",
    );
    await fs.promises.writeFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.interface.snapshots.json`,
      JSON.stringify(snapshots),
      "utf8",
    );
  }
};
