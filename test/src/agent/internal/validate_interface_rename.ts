import { AutoBeAgent } from "@autobe/agent";
import { orchestrateInterfaceSchemaRename } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchemaRename";
import { AutoBeJsonSchemaCollection } from "@autobe/agent/src/orchestrate/interface/utils/AutoBeJsonSchemaCollection";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeExampleProject, AutoBeOpenApi } from "@autobe/interface";

import { validate_interface_operation } from "./validate_interface_operation";
import { validate_interface_schema } from "./validate_interface_schema";

export const validate_interface_rename = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> => {
  const operations: AutoBeOpenApi.IOperation[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "interface.operation.json",
    })) ?? (await validate_interface_operation(props));

  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "interface.schema.json",
    })) ?? (await validate_interface_schema(props));

  // Build document
  const document: AutoBeOpenApi.IDocument = {
    operations,
    components: {
      authorizations: props.agent.getContext().state().analyze?.actors ?? [],
      schemas,
    },
  };

  // Rename schemas (modifies document in-place)
  await orchestrateInterfaceSchemaRename(props.agent.getContext(), {
    operations,
    collection: new AutoBeJsonSchemaCollection(schemas, {}),
    progress: {
      completed: 0,
      total: 0,
    },
  });

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["interface.rename.json"]: JSON.stringify(document.components.schemas),
    },
  });
  return document.components.schemas;
};
