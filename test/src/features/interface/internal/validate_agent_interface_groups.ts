import { orchestrateInterfaceGroups } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceGroups";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeInterfaceGroupEvent } from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_groups = async (props: {
  factory: TestFactory;
  vendor: string;
  project: AutoBeExampleProject;
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
    await AutoBeExampleStorage.save({
      vendor: props.vendor,
      project: props.project,
      files: {
        [`interface.groups.json`]: JSON.stringify(result.groups),
      },
    });
};
