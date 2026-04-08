import { AutoBeAgent } from "@autobe/agent";
import { orchestrateDatabaseGroup } from "@autobe/agent/src/orchestrate/database/orchestrateDatabaseGroup";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeDatabaseGroup, AutoBeExampleProject } from "@autobe/interface";

export const validate_database_group = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeDatabaseGroup[]> => {
  const groups: AutoBeDatabaseGroup[] = await orchestrateDatabaseGroup(
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
