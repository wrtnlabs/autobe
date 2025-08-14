import { orchestrateInterfaceGroups } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceGroups";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeInterfaceGroupsEvent } from "@autobe/interface";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_groups = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.API_KEY === undefined) return false;

  const { agent } = await prepare_agent_interface(factory, project);
  const result: AutoBeInterfaceGroupsEvent = await orchestrateInterfaceGroups(
    agent.getContext(),
  );
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${project}/interface/endpoints`,
    files: {
      ...(await agent.getFiles()),
      "logs/groups.json": JSON.stringify(result.groups),
    },
  });
  if (process.argv.includes("--archive"))
    await TestHistory.save({
      [`${project}.interface.groups.json`]: JSON.stringify(result.groups),
    });
};
