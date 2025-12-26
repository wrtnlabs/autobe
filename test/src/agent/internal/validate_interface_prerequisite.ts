import { AutoBeAgent } from "@autobe/agent";
import { orchestrateInterfacePrerequisite } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfacePrerequisite";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeExampleProject, AutoBeOpenApi } from "@autobe/interface";
import { AutoBeInterfacePrerequisite } from "@autobe/interface/src/histories/contents/AutoBeInterfacePrerequisite";

import { validate_interface_operation } from "./validate_interface_operation";
import { validate_interface_rename } from "./validate_interface_rename";

export const validate_interface_prerequisite = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeInterfacePrerequisite[]> => {
  const document: AutoBeOpenApi.IDocument = {
    operations:
      (await AutoBeExampleStorage.load({
        vendor: props.vendor,
        project: props.project,
        file: "interface.operation.json",
      })) ?? (await validate_interface_operation(props)),
    components: {
      authorizations: props.agent.getContext().state().analyze?.actors ?? [],
      schemas:
        (await AutoBeExampleStorage.load({
          vendor: props.vendor,
          project: props.project,
          file: "interface.rename.json",
        })) ?? (await validate_interface_rename(props)),
    },
  };

  const prerequisites: AutoBeInterfacePrerequisite[] =
    await orchestrateInterfacePrerequisite(props.agent.getContext(), document);

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["interface.prerequisite.json"]: JSON.stringify(prerequisites),
    },
  });
  return prerequisites;
};
