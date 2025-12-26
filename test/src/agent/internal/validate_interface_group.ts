import { AutoBeAgent } from "@autobe/agent";
import { orchestrateInterfaceGroup } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceGroup";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeInterfaceGroupEvent,
} from "@autobe/interface";

export const validate_interface_group = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeInterfaceGroupEvent> => {
  const event: AutoBeInterfaceGroupEvent = await orchestrateInterfaceGroup(
    props.agent.getContext(),
    {
      instruction: "",
    },
  );
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["interface.group.json"]: JSON.stringify(event),
    },
  });
  return event;
};
