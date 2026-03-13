import { AutoBeAgent } from "@autobe/agent";
import { orchestrateInterfaceSchema } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchema";
import { AutoBeInterfaceSchemaRefineProgrammer } from "@autobe/agent/src/orchestrate/interface/programmers/AutoBeInterfaceSchemaRefineProgrammer";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeExampleProject,
  AutoBeInterfaceSchemaEvent,
  AutoBeInterfaceSchemaRefineEvent,
  AutoBeOpenApi,
} from "@autobe/interface";
import { transformOpenApiDocument } from "@autobe/utils";
import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApi } from "typia";

import { TestGlobal } from "../../TestGlobal";
import { validate_interface_operation } from "./validate_interface_operation";

export const validate_interface_schema = async (props: {
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

  const archive = async (next: {
    name: string;
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  }): Promise<void> => {
    const document: OpenApi.IDocument = transformOpenApiDocument({
      operations,
      components: {
        schemas: next.schemas,
        authorizations: props.agent.getContext().state().analyze?.actors ?? [],
      },
    });
    const app: NestiaMigrateApplication = new NestiaMigrateApplication(
      document,
    );
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/interface.schema/${props.project}`,
      files: {
        ...app.nest({
          simulate: false,
          e2e: false,
        }),
        ...(await props.agent.getFiles({
          dbms: "postgres",
        })),
      },
    });
  };

  const schemaEvents: AutoBeInterfaceSchemaEvent[] = [];
  const refineEvents: AutoBeInterfaceSchemaRefineEvent[] = [];
  props.agent.on("interfaceSchema", (e) => {
    schemaEvents.push(e);
  });
  props.agent.on("interfaceSchemaRefine", (e) => {
    refineEvents.push(e);
  });

  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    await orchestrateInterfaceSchema(props.agent.getContext(), {
      instruction: "",
      operations,
    });
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["interface.operation.json"]: JSON.stringify(operations),
      ["interface.schema.json"]: JSON.stringify(schemas),
    },
  });

  await archive({
    name: "interface.schema",
    schemas,
  });
  await archive({
    name: "interface.schema.write",
    schemas: Object.fromEntries(
      schemaEvents.map((e) => [
        e.typeName,
        e.schema as AutoBeOpenApi.IJsonSchemaDescriptive,
      ]),
    ),
  });
  await archive({
    name: "interface.schema.refine",
    schemas: Object.fromEntries(
      refineEvents.map((e) => [
        e.typeName,
        AutoBeInterfaceSchemaRefineProgrammer.execute({
          schema: e.schema as AutoBeOpenApi.IJsonSchema.IObject,
          databaseSchema: e.databaseSchema,
          specification: e.specification,
          description: e.description,
          revises: e.revises,
        }),
      ]),
    ),
  });

  return schemas;
};
