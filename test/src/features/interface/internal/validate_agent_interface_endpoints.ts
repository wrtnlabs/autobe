import { orchestrateInterfaceEndpoints } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceEndpoints";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAssistantMessageHistory,
  AutoBeInterfaceEndpointsEvent,
} from "@autobe/interface";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_endpoints = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  const { agent } = await prepare_agent_interface(factory, project);
  const go = (message?: string) =>
    orchestrateInterfaceEndpoints(agent.getContext(), message);
  let result: AutoBeInterfaceEndpointsEvent | AutoBeAssistantMessageHistory =
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
      "logs/endpoints.json": JSON.stringify(result.endpoints),
    },
  });
};
