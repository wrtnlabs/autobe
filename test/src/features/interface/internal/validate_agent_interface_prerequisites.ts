import { orchestrateInterfacePrerequisites } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfacePrerequisites";
import { CompressUtil, FileSystemIterator } from "@autobe/filesystem";
import { AutoBeEventOfSerializable, AutoBeOpenApi } from "@autobe/interface";
import { AutoBeInterfacePrerequisite } from "@autobe/interface/src/histories/contents/AutoBeInterfacePrerequisite";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestLogger } from "../../../internal/TestLogger";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_prerequisites = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent } = await prepare_agent_interface(factory, project);
  const model: string = TestGlobal.vendorModel;

  for (let type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, (event) => {
      TestLogger.event(new Date(), event);
    });

  console.log(agent.getContext().vendor.model);

  const operations: AutoBeOpenApi.IOperation[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${TestGlobal.ROOT}/assets/histories/${model}/${project}.interface.operations.json.gz`,
      ),
    ),
  );
  typia.assert(operations);

  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    JSON.parse(
      await CompressUtil.gunzip(
        await fs.promises.readFile(
          `${TestGlobal.ROOT}/assets/histories/${model}/${project}.interface.schemas.json.gz`,
        ),
      ),
    );
  // typia.assert(schemas);

  const document: AutoBeOpenApi.IDocument = {
    operations,
    components: {
      schemas,
      authorization: agent.getContext().state().analyze?.roles ?? [],
    },
  };

  // GENERATE OPERATIONS
  const prerequisites: AutoBeInterfacePrerequisite[] =
    await orchestrateInterfacePrerequisites(agent.getContext(), document);
  typia.assert(prerequisites);

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${model}/${project}/interface/operations`,
    files: {
      ...(await agent.getFiles()),
      "logs/prerequisites.json": JSON.stringify(prerequisites, null, 2),
      "logs/operations.json": JSON.stringify(operations),
    },
  });
  if (TestGlobal.archive)
    await TestHistory.save({
      [`${project}.interface.operations.json`]: JSON.stringify(operations),
    });
};
