import { orchestrateInterfaceSchemaReviewer } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchemaReviewer";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeOpenApi } from "@autobe/interface";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_schema_reviewer = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent } = await prepare_agent_interface(factory, project);
  const model: string = TestGlobal.getVendorModel();
  
  // Load schemas and operations
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = JSON.parse(
    await fs.promises.readFile(
      `${TestGlobal.ROOT}/assets/histories/${model}/${project}.interface.schemas.json`,
      "utf8",
    ),
  );
  const operations: AutoBeOpenApi.IOperation[] = JSON.parse(
    await fs.promises.readFile(
      `${TestGlobal.ROOT}/assets/histories/${model}/${project}.interface.operations.json`,
      "utf8",
    ),
  );
  typia.assert(schemas);
  typia.assert(operations);

  // TEST SCHEMA REVIEWER
  const reviewResult = await orchestrateInterfaceSchemaReviewer(
    agent.getContext(),
    schemas,
    operations,
  );
  typia.assert(reviewResult);

  // Create test cases for different security scenarios
  const testCases = [
    {
      name: "valid_schemas",
      schemas: schemas,
      operations: operations.slice(0, 3),
      description: "Testing with valid schemas that should pass review",
    },
    {
      name: "security_violation_password_in_response",
      schemas: {
        ...schemas,
        "IUserResponse": {
          type: "object",
          properties: {
            id: { type: "string", description: "User ID" },
            email: { type: "string", description: "User email" },
            password: { type: "string", description: "User password" }, // SECURITY VIOLATION
          },
          required: ["id", "email", "password"],
          description: "User response with password exposed",
        },
      },
      operations: operations.slice(0, 1),
      description: "Testing with schemas that expose password in response",
    },
    {
      name: "security_violation_secret_token_exposed",
      schemas: {
        ...schemas,
        "IApiResponse": {
          type: "object",
          properties: {
            data: { type: "object", description: "Response data" },
            secretKey: { type: "string", description: "API secret key" }, // SECURITY VIOLATION
            accessToken: { type: "string", description: "Internal access token" }, // SECURITY VIOLATION
          },
          required: ["data"],
          description: "API response with secrets exposed",
        },
      },
      operations: operations.slice(0, 1),
      description: "Testing with schemas that expose secret tokens",
    },
    {
      name: "poor_quality_descriptions",
      schemas: Object.fromEntries(
        Object.entries(schemas).map(([key, schema]) => [
          key,
          {
            ...schema,
            description: "bad", // Poor quality description
          },
        ])
      ),
      operations: operations.slice(0, 1),
      description: "Testing with schemas that have poor quality descriptions",
    },
  ];

  const results: Record<string, any> = {};

  for (const testCase of testCases) {
    try {
      const result = await orchestrateInterfaceSchemaReviewer(
        agent.getContext(),
        testCase.schemas,
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
    root: `${TestGlobal.ROOT}/results/${model}/${project}/interface/schema_reviewer`,
    files: {
      ...(await agent.getFiles()),
      "logs/review_result.json": JSON.stringify(reviewResult, null, 2),
      "logs/test_cases.json": JSON.stringify(results, null, 2),
      "logs/schemas_count.json": JSON.stringify({
        total: Object.keys(schemas).length,
        operations_count: operations.length,
      }, null, 2),
    },
  });

  return true;
};