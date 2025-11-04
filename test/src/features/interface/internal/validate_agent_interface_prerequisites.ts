import { orchestrateInterfacePrerequisites } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfacePrerequisites";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { CompressUtil, FileSystemIterator } from "@autobe/filesystem";
import { AutoBeEventOfSerializable, AutoBeOpenApi } from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import { AutoBeInterfacePrerequisite } from "@autobe/interface/src/histories/contents/AutoBeInterfacePrerequisite";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { ArchiveLogger } from "../../../archive/utils/ArchiveLogger";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_prerequisites = async (props: {
  factory: TestFactory;
  vendor: string;
  project: AutoBeExampleProject;
}) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent } = await prepare_agent_interface(props);
  for (let type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, (event) => {
      ArchiveLogger.event(new Date(), event);
    });

  console.log(agent.getContext().vendor.model);

  const operations: AutoBeOpenApi.IOperation[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${AutoBeExampleStorage.getDirectory(props)}/interface.operations.json.gz`,
      ),
    ),
  );
  typia.assert(operations);

  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    JSON.parse(
      await CompressUtil.gunzip(
        await fs.promises.readFile(
          `${AutoBeExampleStorage.getDirectory(props)}/interface.schemas.json.gz`,
        ),
      ),
    );
  // typia.assert(schemas);

  const document: AutoBeOpenApi.IDocument = {
    operations,
    components: {
      schemas,
      authorizations: agent.getContext().state().analyze?.actors ?? [],
    },
  };

  // GENERATE OPERATIONS
  const prerequisites: AutoBeInterfacePrerequisite[] =
    await orchestrateInterfacePrerequisites(agent.getContext(), document);
  typia.assert(prerequisites);

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/interface/operations`,
    files: {
      ...(await agent.getFiles()),
      "logs/prerequisites.json": JSON.stringify(prerequisites, null, 2),
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
