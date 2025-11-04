import { orchestrateInterfaceOperations } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceOperations";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_operations = async (props: {
  factory: TestFactory;
  vendor: string;
  project: AutoBeExampleProject;
}) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent } = await prepare_agent_interface(props);
  const endpoints: AutoBeOpenApi.IEndpoint[] = JSON.parse(
    await fs.promises.readFile(
      `${AutoBeExampleStorage.getDirectory(props)}/interface.endpoints.json`,
      "utf8",
    ),
  );
  typia.assert(endpoints);

  // GENERATE OPERATIONS
  const operations: AutoBeOpenApi.IOperation[] =
    await orchestrateInterfaceOperations(agent.getContext(), {
      endpoints,
      instruction: "Design API specs carefully considering the security.",
    });
  typia.assert(operations);

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/interface/operations`,
    files: {
      ...(await agent.getFiles()),
      "logs/endpoints.json": JSON.stringify(
        operations.map((op) => ({
          path: op.path,
          method: op.method,
        })),
        null,
        2,
      ),
      "logs/paths.json": JSON.stringify(
        Array.from(new Set(operations.map((op) => op.path))),
        null,
        2,
      ),
      "logs/operations.json": JSON.stringify(operations),
    },
  });
  if (TestGlobal.archive)
    await AutoBeExampleStorage.save({
      vendor: props.vendor,
      project: props.project,
      files: {
        [`interface.operations.json`]: JSON.stringify(operations),
      },
    });
};
