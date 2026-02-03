import { AutoBeAgent } from "@autobe/agent";
import { orchestrateInterfaceActionEndpoint } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceActionEndpoint";
import { orchestrateInterfaceBaseEndpoint } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceBaseEndpoint";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeInterfaceAuthorization,
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceGroupEvent,
  AutoBeProgressEventBase,
} from "@autobe/interface";

import { validate_interface_authorization } from "./validate_interface_authorization";
import { validate_interface_group } from "./validate_interface_group";

export const validate_interface_endpoint = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeInterfaceEndpointDesign[]> => {
  const group: AutoBeInterfaceGroupEvent =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "interface.group.json",
    })) ?? (await validate_interface_group(props));
  const authorizations: AutoBeInterfaceAuthorization[] =
    (await AutoBeExampleStorage.load<AutoBeInterfaceAuthorization[]>({
      vendor: props.vendor,
      project: props.project,
      file: "interface.authorization.json",
    })) ?? (await validate_interface_authorization(props));

  const progress: AutoBeProgressEventBase = {
    completed: 0,
    total: group.groups.length * 2,
  };
  const reviewProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: group.groups.length * 2,
  };
  const baseEndpoints: AutoBeInterfaceEndpointDesign[] =
    await orchestrateInterfaceBaseEndpoint(props.agent.getContext(), {
      instruction: "",
      groups: group.groups,
      progress,
      reviewProgress,
      authorizeOperations: authorizations.map((a) => a.operations).flat(),
    });
  const actionEndpoints: AutoBeInterfaceEndpointDesign[] =
    await orchestrateInterfaceActionEndpoint(props.agent.getContext(), {
      instruction: "",
      groups: group.groups,
      baseEndpoints,
      progress,
      reviewProgress,
      authorizeOperations: authorizations.map((a) => a.operations).flat(),
    });
  const endpoints: AutoBeInterfaceEndpointDesign[] = [
    ...baseEndpoints,
    ...actionEndpoints,
  ];
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["interface.endpoint.json"]: JSON.stringify(endpoints),
    },
  });
  return endpoints;
};
