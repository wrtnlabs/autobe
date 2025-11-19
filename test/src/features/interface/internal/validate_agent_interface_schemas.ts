import { orchestrateInterfaceSchema } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchema";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { CompressUtil, FileSystemIterator } from "@autobe/filesystem";
import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_schemas = async (props: {
  factory: TestFactory;
  vendor: string;
  project: AutoBeExampleProject;
}) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent } = await prepare_agent_interface(props);
  const operations: AutoBeOpenApi.IOperation[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${AutoBeExampleStorage.getDirectory(props)}/interface.operations.json.gz`,
      ),
    ),
  );
  typia.assert(operations);

  // GENERATE COMPONENTS
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    await orchestrateInterfaceSchema(agent.getContext(), {
      operations,
      instruction: "Design API specs carefully considering the security.",
    });
  typia.assert(schemas);
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/interface/schemas`,
    files: {
      ...(await agent.getFiles()),
      "logs/endpoints.json": JSON.stringify(
        operations.map((o) => ({
          path: o.path,
          method: o.method,
        })),
        null,
        2,
      ),
      "logs/operations.json": JSON.stringify(operations),
      "logs/schemas.json": JSON.stringify(schemas),
    },
  });
  if (process.argv.includes("--archive"))
    await AutoBeExampleStorage.save({
      vendor: props.vendor,
      project: props.project,
      files: {
        [`interface.schemas.json`]: JSON.stringify(schemas),
      },
    });
};
