import { AutoBeAgent } from "@autobe/agent";
import { orchestratePrismaComponent } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaComponent";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseGroup,
  AutoBeExampleProject,
} from "@autobe/interface";

import { validate_prisma_group } from "./validate_prisma_group";

export const validate_prisma_component = async (props: {
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
    })) ?? (await validate_prisma_group(props));

  // Process all component skeletons
  const components: AutoBeDatabaseComponent[] =
    await orchestratePrismaComponent(props.agent.getContext(), {
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
