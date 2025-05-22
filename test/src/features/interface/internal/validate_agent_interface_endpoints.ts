import { orchestrateInterfaceEndpoints } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceEndpoints";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAssistantMessageHistory,
  AutoBeInterfaceEndpointsEvent,
  AutoBeOpenApi,
} from "@autobe/interface";

import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_endpoints = async (
  owner: string,
  project: string,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  const { agent } = await prepare_agent_interface(owner, project);
  let result: AutoBeInterfaceEndpointsEvent | AutoBeAssistantMessageHistory =
    await orchestrateInterfaceEndpoints(agent.getContext());
  if (result.type === "assistantMessage")
    result = await orchestrateInterfaceEndpoints(
      agent.getContext(),
      "Don't ask me to whether do or not. Just do it.",
    );
  if (result.type === "assistantMessage")
    throw new Error("Failed to generate interface endpoints.");
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${owner}/${project}/interface/endpoints`,
    files: {
      "endpoints.json": JSON.stringify(result, null, 2),
      "tokenUsage.json": JSON.stringify(agent.getTokenUsage(), null, 2),
    },
  });
};
