import { orchestrateInterfaceComponents } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceComponents";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeOpenApi } from "@autobe/interface";

import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_components = async (
  owner: string,
  project: string,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  const { agent, document } = await prepare_agent_interface(owner, project);
  const components: AutoBeOpenApi.IComponents =
    await orchestrateInterfaceComponents(
      agent.getContext(),
      document.operations,
    );
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${owner}/${project}/interface/components`,
    files: {
      "endpoints.json": JSON.stringify(
        document.operations.map((o) => ({
          path: o.path,
          method: o.method,
        })),
        null,
        2,
      ),
      "operations.json": JSON.stringify(document.operations, null, 2),
      "components.json": JSON.stringify(components, null, 2),
      "tokenUsage.json": JSON.stringify(agent.getTokenUsage(), null, 2),
    },
  });
};
