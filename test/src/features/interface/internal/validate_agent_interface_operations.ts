import { orchestrateInterfaceOperations } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceOperations";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeOpenApi } from "@autobe/interface";

import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_operations = async (
  owner: string,
  project: string,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  const { agent, document } = await prepare_agent_interface(owner, project);
  const result: AutoBeOpenApi.IOperation[] =
    await orchestrateInterfaceOperations(
      agent.getContext(),
      document.operations.map((o) => ({
        path: o.path,
        method: o.method,
      })),
    );
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${owner}/${project}/interface/operations`,
    files: {
      "endpoints.json": JSON.stringify(
        document.operations.map((o) => ({
          path: o.path,
          method: o.method,
        })),
        null,
        2,
      ),
      "operations.json": JSON.stringify(result, null, 2),
      "tokenUsage.json": JSON.stringify(agent.getTokenUsage(), null, 2),
    },
  });
};
