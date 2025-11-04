import { orchestrateInterfaceEndpoints } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceEndpoints";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeInterfaceGroup } from "@autobe/interface/src/histories/contents/AutoBeInterfaceGroup";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { ArchiveStorage } from "../../../archive/utils/ArchiveStorage";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_endpoints = async (props: {
  factory: TestFactory;
  vendor: string;
  project: TestProject;
}) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  const { agent } = await prepare_agent_interface(props);
  const groups: AutoBeInterfaceGroup[] = typia.json.assertParse<
    AutoBeInterfaceGroup[]
  >(
    await fs.promises.readFile(
      `${ArchiveStorage.getDirectory(props)}/interface.groups.json`,
      "utf8",
    ),
  );
  const authorizations: AutoBeOpenApi.IOperation[] = typia.json.assertParse<
    AutoBeOpenApi.IOperation[]
  >(
    await fs.promises.readFile(
      `${ArchiveStorage.getDirectory(props)}/interface.authorizations.json`,
      "utf8",
    ),
  );

  const endpoints: AutoBeOpenApi.IEndpoint[] =
    await orchestrateInterfaceEndpoints(agent.getContext(), {
      groups,
      authorizations,
      instruction: "Design API specs carefully considering the security.",
    });
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/interface/endpoints`,
    files: {
      ...(await agent.getFiles()),
      "logs/endpoints.json": JSON.stringify(endpoints),
    },
  });
  if (TestGlobal.archive)
    await ArchiveStorage.save({
      vendor: props.vendor,
      project: props.project,
      files: {
        [`interface.endpoints.json`]: JSON.stringify(endpoints),
      },
    });
};
