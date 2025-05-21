import { orchestrateInterface } from "@autobe/agent/src/orchestrate/interface/orchestrateInterface";
import { orchestrateInterfaceEndpoints } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceEndpoints";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAssistantMessageHistory,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
} from "@autobe/interface";

import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_main = async (
  owner: string,
  project: string,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  const { agent } = await prepare_agent_interface(owner, project);
  const result: AutoBeInterfaceHistory | AutoBeAssistantMessageHistory =
    await orchestrateInterface(agent.getContext())({
      reason: "Step to the interface designing after DB schema generation",
    });
  if (result.type !== "interface")
    throw new Error("History type must be interface.");

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${owner}/${project}/interface/main`,
    files: {
      ...agent.getFiles(),
      "logs/result.json": JSON.stringify(result, null, 2),
      "logs/tokenUsage.json": JSON.stringify(agent.getTokenUsage(), null, 2),
    },
  });
};
