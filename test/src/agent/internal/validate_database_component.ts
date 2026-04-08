import { AutoBeAgent } from "@autobe/agent";
import { orchestrateDatabaseComponent } from "@autobe/agent/src/orchestrate/database/orchestrateDatabaseComponent";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseGroup,
  AutoBeExampleProject,
} from "@autobe/interface";

import { validate_database_group } from "./validate_database_group";

export const validate_database_component = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeDatabaseComponent[]> => {
  // Get groups first
  const groups: AutoBeDatabaseGroup[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.group.json",
    })) ?? (await validate_database_group(props));

  // Process all component skeletons
  const components: AutoBeDatabaseComponent[] =
    await orchestrateDatabaseComponent(props.agent.getContext(), {
      instruction: "",
      groups,
    });

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["prisma.component.json"]: JSON.stringify(components),
    },
  });
  return components;
};
