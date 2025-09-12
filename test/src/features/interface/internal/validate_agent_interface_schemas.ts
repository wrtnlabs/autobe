import { orchestrateInterfaceSchemas } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchemas";
import { CompressUtil, FileSystemIterator } from "@autobe/filesystem";
import { AutoBeOpenApi } from "@autobe/interface";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_schemas = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent } = await prepare_agent_interface(factory, project);
  const model: string = TestGlobal.vendorModel;
  const operations: AutoBeOpenApi.IOperation[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${TestGlobal.ROOT}/assets/histories/${model}/${project}.interface.operations.json.gz`,
      ),
    ),
  );
  typia.assert(operations);

  // GENERATE COMPONENTS
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    await orchestrateInterfaceSchemas(agent.getContext(), operations);
  typia.assert(schemas);
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${model}/${project}/interface/schemas`,
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
    await TestHistory.save({
      [`${project}.interface.schemas.json`]: JSON.stringify(schemas),
    });
};
