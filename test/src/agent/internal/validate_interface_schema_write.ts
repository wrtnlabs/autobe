import { AutoBeAgent } from "@autobe/agent";
import { orchestrateInterfaceSchemaWrite } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchemaWrite";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeExampleProject, AutoBeOpenApi } from "@autobe/interface";

import { validate_interface_operation } from "./validate_interface_operation";

export const validate_interface_schema_write = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<Record<string, AutoBeOpenApi.IJsonSchema>> => {
  const operations: AutoBeOpenApi.IOperation[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "interface.operation.json",
    })) ?? (await validate_interface_operation(props));

  const schemas: Record<string, AutoBeOpenApi.IJsonSchema> =
    await orchestrateInterfaceSchemaWrite(props.agent.getContext(), {
      instruction: "",
      operations,
    });

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["interface.schema.json"]: JSON.stringify(schemas),
    },
  });
  return schemas;
};
