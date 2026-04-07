import { AutoBeAgent } from "@autobe/agent";
import { orchestrateDatabaseAuthorization } from "@autobe/agent/src/orchestrate/database/orchestrateDatabaseAuthorization";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseGroup,
  AutoBeExampleProject,
} from "@autobe/interface";

import { validate_database_group } from "./validate_database_group";

export const validate_database_authorization = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeDatabaseComponent | null> => {
  // Get groups first (need authorization group)
  const groups: AutoBeDatabaseGroup[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.group.json",
    })) ?? (await validate_database_group(props));

  // Process authorization tables for all actors
  const component: AutoBeDatabaseComponent | null =
    await orchestrateDatabaseAuthorization(props.agent.getContext(), {
      instruction: "",
      groups,
    });
  if (component === null) return null;

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["prisma.authorization.json"]: JSON.stringify(component),
    },
  });
  return component;
};
