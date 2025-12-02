import { orchestrateTestPrepareWrite } from "@autobe/agent/src/orchestrate/test/orchestrateTestPrepareWrite";
import { IAutoBeTestPrepareWriteResult } from "@autobe/agent/src/orchestrate/test/structures/IAutoBeTestPrepareWriteResult";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeEventOfSerializable, AutoBeOpenApi } from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { ArchiveLogger } from "../../../archive/utils/ArchiveLogger";
import { prepare_agent_test } from "./prepare_agent_test";

export const validate_agent_test_prepare_write = async (props: {
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
  const result: IAutoBeTestPrepareWriteResult[] =
    await orchestrateTestPrepareWrite(
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

  const generatedTypes = new Set(result.map((res) => res.function.dtoTypeName));
  const missingTypes = Array.from(createDtoTypes).filter(
    (type) => !generatedTypes.has(type),
  );

  if (missingTypes.length > 0) {
    throw new Error(
      `Missing prepare functions for DTOs: ${missingTypes.join(", ")}`,
    );
  }

  // Validate function content
  for (const res of result) {
    // Check that function has proper structure
    if (!res.function.content.includes("export")) {
      throw new Error(
        `Prepare function ${res.function.functionName} does not export`,
      );
    }
    // Check function name convention
    if (!res.function.functionName.startsWith("prepare_random_")) {
      throw new Error(
        `Function name ${res.function.functionName} does not follow naming convention`,
      );
    }
  }

  // REPORT RESULT
  const files: Record<string, string> = {
    ...(await agent.getFiles()),
  };

  // Add generated prepare functions to files
  for (const res of result) {
    files[res.function.location] = res.function.content;
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

  return true;
};
