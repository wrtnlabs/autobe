import { orchestrateInterfaceGroups } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceGroups";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeInterfaceGroupEvent } from "@autobe/interface";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { ArchiveStorage } from "../../../archive/utils/ArchiveStorage";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_groups = async (props: {
  factory: TestFactory;
  vendor: string;
  project: TestProject;
}) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  const { agent } = await prepare_agent_interface(props);
  const result: AutoBeInterfaceGroupEvent = await orchestrateInterfaceGroups(
    agent.getContext(),
    {
      instruction: "Design API specs carefully considering the security.",
    },
  );
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/interface/groups`,
    files: {
      ...(await agent.getFiles()),
      "logs/groups.json": JSON.stringify(result.groups),
    },
  });
  if (TestGlobal.archive)
    await ArchiveStorage.save({
      vendor: props.vendor,
      project: props.project,
      files: {
        [`interface.groups.json`]: JSON.stringify(result.groups),
      },
    });
};
