import { orchestrateInterfaceOperations } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceOperations";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeOpenApi } from "@autobe/interface";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_operations = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent } = await prepare_agent_interface(factory, project);
  const endpoints: AutoBeOpenApi.IEndpoint[] = JSON.parse(
    await fs.promises.readFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.interface.endpoints.json`,
      "utf8",
    ),
  );
  typia.assert(endpoints);

  // GENERATE OPERATIONS
  const operations: AutoBeOpenApi.IOperation[] =
    await orchestrateInterfaceOperations(agent.getContext(), endpoints);

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${project}/interface/components`,
    files: {
      ...(await agent.getFiles()),
      "logs/endpoints.json": JSON.stringify(endpoints, null, 2),
      "logs/operations.json": JSON.stringify(operations, null, 2),
    },
  });
  typia.assert(operations);
};
