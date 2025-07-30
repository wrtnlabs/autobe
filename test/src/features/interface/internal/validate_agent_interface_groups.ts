import { orchestrateInterfaceGroups } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceGroups";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAssistantMessageHistory,
  AutoBeInterfaceGroupsEvent,
} from "@autobe/interface";
import fs from "fs";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_groups = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  const { agent } = await prepare_agent_interface(factory, project);
  const go = (message?: string) =>
    orchestrateInterfaceGroups(agent.getContext(), message);
  let result: AutoBeInterfaceGroupsEvent | AutoBeAssistantMessageHistory =
    await go();
  if (result.type === "assistantMessage") {
    result = await go("Don't ask me to whether do or not. Just do it.");
    if (result.type === "assistantMessage")
      throw new Error("Failed to generate interface endpoints.");
  }
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${project}/interface/endpoints`,
    files: {
      ...(await agent.getFiles()),
      "logs/groups.json": JSON.stringify(result.groups),
    },
  });
  if (process.argv.includes("--archive"))
    await fs.promises.writeFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.interface.groups.json`,
      JSON.stringify(result.groups),
      "utf8",
    );
};
