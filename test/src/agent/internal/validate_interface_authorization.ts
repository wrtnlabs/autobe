import { AutoBeAgent } from "@autobe/agent";
import { orchestrateInterfaceAuthorization } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceAuthorization";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeInterfaceAuthorization,
} from "@autobe/interface";

export const validate_interface_authorization = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeInterfaceAuthorization[]> => {
  const authorizations: AutoBeInterfaceAuthorization[] =
    await orchestrateInterfaceAuthorization(props.agent.getContext(), {
      instruction: "",
    });
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["interface.authorization.json"]: JSON.stringify(authorizations),
    },
  });
  return authorizations;
};
