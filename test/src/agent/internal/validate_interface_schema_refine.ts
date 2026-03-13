import { AutoBeAgent } from "@autobe/agent";
import { orchestrateInterfaceSchemaRefine } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchemaRefine";
import { orchestrateInterfaceSchemaWrite } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchemaWrite";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeExampleProject, AutoBeOpenApi } from "@autobe/interface";
import { transformOpenApiDocument } from "@autobe/utils";
import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApi } from "typia";

import { TestGlobal } from "../../TestGlobal";
import { validate_interface_operation } from "./validate_interface_operation";

export const validate_interface_schema_refine = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> => {
  const operations: AutoBeOpenApi.IOperation[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "interface.operation.json",
    })) ?? (await validate_interface_operation(props));
  const original: Record<string, AutoBeOpenApi.IJsonSchema> =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "interface.schema.write.json",
    })) ??
    (await orchestrateInterfaceSchemaWrite(props.agent.getContext(), {
      instruction: "",
      operations,
    }));
  const refined: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    await orchestrateInterfaceSchemaRefine(props.agent.getContext(), {
      document: {
        operations,
        components: {
          schemas: original as Record<
            string,
            AutoBeOpenApi.IJsonSchemaDescriptive
          >,
          authorizations:
            props.agent.getContext().state().analyze?.actors ?? [],
        },
      },
      schemas: original,
      instruction: "",
      progress: {
        total: 0,
        completed: 0,
      },
    });

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["interface.schema.refine.json"]: JSON.stringify(refined),
    },
  });

  const document: OpenApi.IDocument = transformOpenApiDocument({
    operations,
    components: {
      schemas: refined,
      authorizations: props.agent.getContext().state().analyze?.actors ?? [],
    },
  });
  const app: NestiaMigrateApplication = new NestiaMigrateApplication(document);
  const files: Record<string, string> = app.nest({
    simulate: true,
    e2e: true,
  });
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/interface.schema.refine/${props.project}`,
    files: {
      ...files,
      ...(await props.agent.getFiles({
        dbms: "postgres",
      })),
    },
  });

  return refined;
};
