import { orchestrateInterfaceComplement } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceComplement";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import { OpenApiTypeChecker } from "@samchon/openapi";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_complement = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent } = await prepare_agent_interface(factory, project);
  const operations: AutoBeOpenApi.IOperation[] = JSON.parse(
    await fs.promises.readFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.interface.operations.json`,
      "utf8",
    ),
  );
  const components: AutoBeOpenApi.IComponents = JSON.parse(
    await fs.promises.readFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.interface.components.json`,
      "utf8",
    ),
  );
  typia.assert(operations);
  typia.assert(components);

  // COMPLEMENT DOCUMENT
  const complemented: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    await orchestrateInterfaceComplement(agent.getContext(), {
      operations,
      components,
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
    root: `${TestGlobal.ROOT}/results/${project}/interface/complement`,
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
  TestValidator.equals("missed")(Array.from(missed).sort())([]);
};
