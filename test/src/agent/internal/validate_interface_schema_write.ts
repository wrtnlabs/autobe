import { AutoBeAgent } from "@autobe/agent";
import { orchestrateInterfaceSchemaWrite } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchemaWrite";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeExampleProject, AutoBeOpenApi } from "@autobe/interface";
import { transformOpenApiDocument } from "@autobe/utils";
import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApi } from "typia";

import { TestGlobal } from "../../TestGlobal";
import { validate_interface_operation } from "./validate_interface_operation";

export const validate_interface_schema_write = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<Record<string, AutoBeOpenApi.IJsonSchema>> => {
  const operations: AutoBeOpenApi.IOperation[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "interface.operation.json",
    })) ?? (await validate_interface_operation(props));

  const schemas: Record<string, AutoBeOpenApi.IJsonSchema> =
    await orchestrateInterfaceSchemaWrite(props.agent.getContext(), {
      instruction: "",
      operations,
    });

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["interface.schema.write.json"]: JSON.stringify(schemas),
    },
  });

  const document: OpenApi.IDocument = transformOpenApiDocument({
    operations,
    components: {
      schemas: schemas as Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
      authorizations: props.agent.getContext().state().analyze?.actors ?? [],
    },
  });
  const app: NestiaMigrateApplication = new NestiaMigrateApplication(document);
  const files: Record<string, string> = app.nest({
    simulate: true,
    e2e: true,
  });
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/interface.schema.write/${props.project}`,
    files: {
      ...files,
      ...(await props.agent.getFiles({
        dbms: "postgres",
        phase: "database",
      })),
    },
  });

  return schemas;
};
