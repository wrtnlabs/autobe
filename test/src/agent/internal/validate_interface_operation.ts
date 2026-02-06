import { AutoBeAgent } from "@autobe/agent";
import { orchestrateInterfaceOperation } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceOperation";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeExampleProject,
  AutoBeInterfaceAuthorization,
  AutoBeInterfaceEndpointDesign,
  AutoBeOpenApi,
} from "@autobe/interface";
import { transformOpenApiDocument } from "@autobe/utils";
import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApi } from "@samchon/openapi";

import { TestGlobal } from "../../TestGlobal";
import { validate_interface_authorization } from "./validate_interface_authorization";
import { validate_interface_endpoint } from "./validate_interface_endpoint";

export const validate_interface_operation = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeOpenApi.IOperation[]> => {
  const designs: AutoBeInterfaceEndpointDesign[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "interface.endpoint.json",
    })) ?? (await validate_interface_endpoint(props));

  const operations: AutoBeOpenApi.IOperation[] = [
    ...(
      (await AutoBeExampleStorage.load<AutoBeInterfaceAuthorization[]>({
        vendor: props.vendor,
        project: props.project,
        file: "interface.authorization.json",
      })) ?? (await validate_interface_authorization(props))
    )
      .map((a) => a.operations)
      .flat(),
    ...(await orchestrateInterfaceOperation(props.agent.getContext(), {
      designs,
      instruction: "",
    })),
  ];
  console.log("operations are ready", operations.length);

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["interface.operation.json"]: JSON.stringify(operations),
    },
  });

  const document: OpenApi.IDocument = transformOpenApiDocument({
    operations,
    components: {
      authorizations: [],
      schemas: Object.fromEntries(
        Array.from(
          new Set(
            operations
              .map((op) => [
                op.requestBody?.typeName ?? null,
                op.responseBody?.typeName ?? null,
              ])
              .flat()
              .filter((n) => n !== null),
          ),
        ).map((typeName) => [
          typeName,
          {
            type: "object",
            properties: {},
            required: [],
            description: "",
          } satisfies AutoBeOpenApi.IJsonSchemaDescriptive.IObject,
        ]),
      ),
    },
  });
  const app: NestiaMigrateApplication = new NestiaMigrateApplication(document);
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/interface.operation/${props.project}`,
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

  console.log(
    "operations",
    JSON.stringify(
      operations.map((op) => ({
        path: op.path,
        method: op.method,
      })),
      null,
      2,
    ),
  );
  return operations;
};
