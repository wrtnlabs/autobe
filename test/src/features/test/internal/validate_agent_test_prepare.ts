import { orchestrateTestPrepare } from "@autobe/agent/src/orchestrate/test/orchestrateTestPrepare";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeOpenApi,
  AutoBeTestWritePrepareFunction,
} from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { ArchiveLogger } from "../../../archive/utils/ArchiveLogger";
import { prepare_agent_test } from "./prepare_agent_test";

export const validate_agent_test_prepare = async (props: {
  factory: TestFactory;
  vendor: string;
  project: AutoBeExampleProject;
}) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent, interface: interfaceState } = await prepare_agent_test(props);
  const start: Date = new Date();
  for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, (event) => ArchiveLogger.event(start, event));

  // GENERATE TEST PREPARE FUNCTIONS
  const operations: AutoBeOpenApi.IOperation[] =
    interfaceState.document.operations;
  const result: AutoBeTestWritePrepareFunction[] = await orchestrateTestPrepare(
    agent.getContext(),
    "Generate test data preparation functions for all ICreate DTOs.",
  );
  typia.assert(result);

  // VALIDATE PREPARE FUNCTIONS
  // Check that all ICreate DTOs have prepare functions
  const createDtoTypes = new Set<string>();
  for (const operation of operations) {
    if (
      operation.method === "post" &&
      operation.requestBody !== null &&
      operation.requestBody.typeName &&
      (operation.requestBody.typeName.includes(".ICreate") ||
        operation.requestBody.typeName.endsWith("ICreate"))
    ) {
      createDtoTypes.add(operation.requestBody.typeName);
    }
  }

  const generatedTypes = new Set(result.map((func) => func.dtoTypeName));
  const missingTypes = Array.from(createDtoTypes).filter(
    (type) => !generatedTypes.has(type),
  );

  if (missingTypes.length > 0) {
    throw new Error(
      `Missing prepare functions for DTOs: ${missingTypes.join(", ")}`,
    );
  }

  // Validate function content
  for (const func of result) {
    // Check that function has proper structure
    if (!func.content.includes("export")) {
      throw new Error(`Prepare function ${func.functionName} does not export`);
    }
    // Check function name convention
    if (!func.functionName.startsWith("prepare_random_")) {
      throw new Error(
        `Function name ${func.functionName} does not follow naming convention`,
      );
    }
  }

  // REPORT RESULT
  const files: Record<string, string> = {
    ...(await agent.getFiles()),
  };

  // Add generated prepare functions to files
  for (const func of result) {
    files[func.location] = func.content;
  }

  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/test/prepare`,
    files,
  });

  if (TestGlobal.archive) {
    await AutoBeExampleStorage.save({
      vendor: props.vendor,
      project: props.project,
      files: {
        [`test.prepare.json`]: JSON.stringify(result, null, 2),
      },
    });
  }

  console.log(`Generated ${result.length} prepare functions`);
  return true;
};
