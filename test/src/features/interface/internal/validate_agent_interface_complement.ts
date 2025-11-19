import { orchestrateInterfaceComplement } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceComplement";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { CompressUtil, FileSystemIterator } from "@autobe/filesystem";
import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import { OpenApiTypeChecker } from "@samchon/openapi";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_complement = async (props: {
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
  const components: AutoBeOpenApi.IComponents = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${AutoBeExampleStorage.getDirectory(props)}/interface.schemas.json.gz`,
      ),
    ),
  );
  typia.assert(operations);
  typia.assert(components);

  // COMPLEMENT DOCUMENT
  const complemented: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    await orchestrateInterfaceComplement(agent.getContext(), {
      instruction: "Design API specs carefully considering the security.",
      document: {
        operations,
        components,
      },
      progress: {
        completed: 0,
        total: 0,
      },
    });

  // VALIDATE COMPLEMENT
  const prepraed: Set<string> = new Set(Object.keys(complemented));
  const missed: Set<string> = new Set();
  const visit = (schema: AutoBeOpenApi.IJsonSchema) =>
    OpenApiTypeChecker.visit({
      schema,
      components: {
        schemas: complemented,
      },
      closure: (next) => {
        if (OpenApiTypeChecker.isReference(next)) {
          const key: string = next.$ref.split("/").pop()!;
          if (prepraed.has(key) === false) missed.add(key);
        }
      },
    });
  for (const op of operations) {
    if (op.requestBody !== null)
      visit({
        $ref: `#/components/schemas/${op.requestBody.typeName}`,
      });
    if (op.responseBody !== null)
      visit({
        $ref: `#/components/schemas/${op.responseBody.typeName}`,
      });
  }

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/interface/complement`,
    files: {
      ...(await agent.getFiles()),
      "logs/operations.json": JSON.stringify(operations),
      "logs/components.json": JSON.stringify(components),
      "logs/complemented.json": JSON.stringify(complemented),
      "logs/prepared.json": JSON.stringify(
        Array.from(prepraed).sort(),
        null,
        2,
      ),
      "logs/missed.json": JSON.stringify(Array.from(missed).sort()),
    },
  });
  TestValidator.equals("missed", Array.from(missed).sort(), []);
};
