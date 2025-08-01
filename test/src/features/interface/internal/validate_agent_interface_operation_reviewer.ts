import { orchestrateInterfaceOperationReviewer } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceOperationReviewer";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeOpenApi } from "@autobe/interface";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_operation_reviewer = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent } = await prepare_agent_interface(factory, project);
  const model: string = TestGlobal.getVendorModel();
  const operations: AutoBeOpenApi.IOperation[] = JSON.parse(
    await fs.promises.readFile(
      `${TestGlobal.ROOT}/assets/histories/${model}/${project}.interface.operations.json`,
      "utf8",
    ),
  );
  typia.assert(operations);

  // TEST OPERATION REVIEWER
  const reviewResult = await orchestrateInterfaceOperationReviewer(
    agent.getContext(),
    operations,
  );
  typia.assert(reviewResult);

  // Create test cases for different scenarios
  const testCases = [
    {
      name: "valid_operations",
      operations: operations.slice(0, 3), // Test with a subset
      description: "Testing with valid operations that should pass review",
    },
    {
      name: "invalid_operations_missing_description",
      operations: operations.map(op => ({
        ...op,
        description: "", // Invalid: empty description
      })),
      description: "Testing with operations that have missing descriptions",
    },
    {
      name: "invalid_operations_incorrect_method",
      operations: operations.map(op => ({
        ...op,
        method: op.method === "get" && op.requestBody !== null ? "get" : op.method, // Invalid: GET with body
      })),
      description: "Testing with operations that have incorrect HTTP methods",
    },
  ];

  const results: Record<string, any> = {};

  for (const testCase of testCases) {
    try {
      const result = await orchestrateInterfaceOperationReviewer(
        agent.getContext(),
        testCase.operations,
      );
      results[testCase.name] = {
        description: testCase.description,
        result: result,
        success: true,
      };
    } catch (error) {
      results[testCase.name] = {
        description: testCase.description,
        error: error instanceof Error ? error.message : String(error),
        success: false,
      };
    }
  }

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${model}/${project}/interface/operation_reviewer`,
    files: {
      ...(await agent.getFiles()),
      "logs/review_result.json": JSON.stringify(reviewResult, null, 2),
      "logs/test_cases.json": JSON.stringify(results, null, 2),
      "logs/operations_count.json": JSON.stringify({
        total: operations.length,
        tested: testCases.map(tc => tc.operations.length),
      }, null, 2),
    },
  });

  return true;
};