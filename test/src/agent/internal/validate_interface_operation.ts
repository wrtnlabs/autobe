import { AutoBeAgent } from "@autobe/agent";
import { orchestrateInterfaceOperation } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceOperation";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeExampleProject, AutoBeOpenApi } from "@autobe/interface";

import { validate_interface_endpoint } from "./validate_interface_endpoint";

export const validate_interface_operation = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeOpenApi.IOperation[]> => {
  const endpoints: AutoBeOpenApi.IEndpoint[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "interface.endpoint.json",
    })) ?? (await validate_interface_endpoint(props));

  const operations: AutoBeOpenApi.IOperation[] =
    await orchestrateInterfaceOperation(props.agent.getContext(), {
      endpoints,
      instruction: "",
    });

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["interface.operation.json"]: JSON.stringify(operations),
    },
  });
  return operations;
};
