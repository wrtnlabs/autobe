import { AutoBeAgent } from "@autobe/agent";
import { AutoBeJsonSchemaFactory } from "@autobe/agent/src/orchestrate/interface/utils/AutoBeJsonSchemaFactory";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeOpenApi } from "@autobe/interface";
import { transformOpenApiDocument } from "@autobe/utils";
import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApi } from "@samchon/openapi";

import { TestGlobal } from "../TestGlobal";
import { prepare_interface_agent } from "../agent/internal/prepare_interface_agent";

const main = async (): Promise<void> => {
  const load = async <T>(file: string) => {
    const data: T | null = await AutoBeExampleStorage.load<T>({
      vendor: "qwen/qwen3-next-80b-a3b-instruct",
      project: "todo",
      file,
    });
    if (data == null)
      throw new Error(`Failed to load example data for file: ${file}`);
    return data;
  };

  const operations: AutoBeOpenApi.IOperation[] = await load(
    "interface.operation.json",
  );
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    await load("interface.schema.json");

  AutoBeJsonSchemaFactory.removeUnused({
    operations,
    schemas,
  });
  console.log("after removed", Object.keys(schemas));
  for (const op of operations)
    console.log(
      op.method,
      op.path,
      op.requestBody?.typeName,
      op.responseBody?.typeName,
    );

  const agent: AutoBeAgent = await prepare_interface_agent({
    vendor: TestGlobal.vendorModel,
    project: "todo",
  });
  const document: OpenApi.IDocument = transformOpenApiDocument({
    operations,
    components: {
      schemas,
      authorizations: [],
    },
  });
  const app: NestiaMigrateApplication = new NestiaMigrateApplication(document);
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/interface.schema/todo`,
    files: {
      ...app.nest({
        simulate: false,
        e2e: false,
      }),
      ...(await agent.getFiles({
        dbms: "postgres",
      })),
    },
  });
};
main().catch(console.error);
