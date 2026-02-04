import { AutoBeAgent } from "@autobe/agent";
import { orchestrateInterfaceSchema } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchema";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeExampleProject, AutoBeOpenApi } from "@autobe/interface";

import { validate_interface_operation } from "./validate_interface_operation";

export const validate_interface_schema = async (props: {
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

  // Initial schema generation
  const document: AutoBeOpenApi.IDocument = {
    operations,
    components: {
      authorizations: props.agent.getContext().state().analyze?.actors ?? [],
      schemas: await orchestrateInterfaceSchema(props.agent.getContext(), {
        instruction: "",
        operations,
      }),
    },
  };
  return document.components.schemas;
};
