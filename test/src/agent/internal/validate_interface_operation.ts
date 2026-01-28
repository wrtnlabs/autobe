import { AutoBeAgent } from "@autobe/agent";
import { orchestrateInterfaceOperation } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceOperation";
import { orchestrateInterfaceSchemaRename } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchemaRename";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeInterfaceAuthorization,
  AutoBeInterfaceEndpointDesign,
  AutoBeOpenApi,
} from "@autobe/interface";

import { validate_interface_authorization } from "./validate_interface_authorization";
import { validate_interface_endpoint } from "./validate_interface_endpoint";

export const validate_interface_operation = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeOpenApi.IOperation[]> => {
  const designs: AutoBeInterfaceEndpointDesign[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "interface.endpoint.json",
    })) ?? (await validate_interface_endpoint(props));

  const operations: AutoBeOpenApi.IOperation[] = [
    ...(
      (await AutoBeExampleStorage.load<AutoBeInterfaceAuthorization[]>({
        vendor: props.vendor,
        project: props.project,
        file: "interface.authorization.json",
      })) ?? (await validate_interface_authorization(props))
    )
      .map((a) => a.operations)
      .flat(),
    ...(await orchestrateInterfaceOperation(props.agent.getContext(), {
      designs,
      instruction: "",
    })),
  ];
  console.log("operations are ready", operations.length);

  await orchestrateInterfaceSchemaRename(props.agent.getContext(), {
    document: {
      operations,
      components: {
        authorizations: [],
        schemas: {},
      },
    },
    progress: {
      completed: 0,
      total: 0,
    },
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
