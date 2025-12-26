import { AutoBeAgent } from "@autobe/agent";
import { orchestrateInterfaceActionEndpoint } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceActionEndpoint";
import { orchestrateInterfaceBaseEndpoint } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceBaseEndpoint";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeInterfaceAuthorization,
  AutoBeInterfaceGroupEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";

import { validate_interface_authorization } from "./validate_interface_authorization";
import { validate_interface_group } from "./validate_interface_group";

export const validate_interface_endpoint = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeOpenApi.IEndpoint[]> => {
  const group: AutoBeInterfaceGroupEvent =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "interface.group.json",
    })) ?? (await validate_interface_group(props));
  const authorizations: AutoBeInterfaceAuthorization[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "interface.authorization.json",
    })) ?? (await validate_interface_authorization(props));

  const progress: AutoBeProgressEventBase = {
    completed: 0,
    total: group.groups.length * 2,
  };
  const baseEndpoints: AutoBeOpenApi.IEndpoint[] =
    await orchestrateInterfaceBaseEndpoint(props.agent.getContext(), {
      instruction: "",
      groups: group.groups,
      authorizations: authorizations.map((a) => a.operations).flat(),
      progress,
    });
  const actionEndpoints: AutoBeOpenApi.IEndpoint[] =
    await orchestrateInterfaceActionEndpoint(props.agent.getContext(), {
      instruction: "",
      groups: group.groups,
      authorizations: authorizations.map((a) => a.operations).flat(),
      excluded: baseEndpoints,
      progress,
    });
  const endpoints: AutoBeOpenApi.IEndpoint[] = [
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
