import { AutoBeAgent } from "@autobe/agent";
import { orchestratePrismaGroup } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaGroup";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeDatabaseGroup,
  AutoBeExampleProject,
} from "@autobe/interface";

export const validate_prisma_group = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeDatabaseGroup[]> => {
  const groups: AutoBeDatabaseGroup[] = await orchestratePrismaGroup(
    props.agent.getContext(),
    "",
  );
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["prisma.group.json"]: JSON.stringify(groups),
    },
  });
  return groups;
};
