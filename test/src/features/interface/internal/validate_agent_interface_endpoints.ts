import { orchestrateInterfaceEndpoints } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceEndpoints";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeInterfaceGroup } from "@autobe/interface/src/histories/contents/AutoBeInterfaceGroup";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_endpoints = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.API_KEY === undefined) return false;

  const { agent } = await prepare_agent_interface(factory, project);
  const model: string = TestGlobal.getModel();
  const groups: AutoBeInterfaceGroup[] = typia.json.assertParse<
    AutoBeInterfaceGroup[]
  >(
    await fs.promises.readFile(
      `${TestGlobal.ROOT}/assets/histories/${model}/${project}.interface.groups.json`,
      "utf8",
    ),
  );
  const endpoints: AutoBeOpenApi.IEndpoint[] =
    await orchestrateInterfaceEndpoints(agent.getContext(), groups);
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${model}/${project}/interface/endpoints`,
    files: {
      ...(await agent.getFiles()),
      "logs/endpoints.json": JSON.stringify(endpoints),
    },
  });
  if (process.argv.includes("--archive"))
    await TestHistory.save({
      [`${project}.interface.endpoints.json`]: JSON.stringify(endpoints),
    });
};
