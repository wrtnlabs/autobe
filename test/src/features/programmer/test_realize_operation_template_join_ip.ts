import { writeRealizeOperationTemplate } from "@autobe/agent/src/orchestrate/realize/programmers/internal/writeRealizeOperationTemplate";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { createMockCollector } from "./internal/createMockCollector";
import { createMockOperation } from "./internal/createMockOperation";
import { createMockScenario } from "./internal/createMockScenario";

namespace IMember {
  export interface IJoin {
    email: string;
    password: string;
    name: string;
  }
}

export const test_realize_operation_template_join_ip = (): void => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    typia.json.schemas<[IMember.IJoin]>().components.schemas as Record<
      string,
      AutoBeOpenApi.IJsonSchemaDescriptive
    >;

  const operation: AutoBeOpenApi.IOperation = createMockOperation({
    method: "post",
    path: "/auth/join",
    requestBody: { typeName: "IMember.IJoin" },
  });

  const result: string = writeRealizeOperationTemplate({
    scenario: createMockScenario(operation),
    operation,
    imports: [],
    authorization: null,
    schemas,
    collectors: [
      createMockCollector({
        dtoTypeName: "IMember.IJoin",
        databaseSchemaName: "members",
      }),
    ],
    transformers: [],
  });

  TestValidator.equals(
    "ip parameter present",
    result.includes("ip: string"),
    true,
  );
  TestValidator.equals(
    "body parameter present",
    result.includes("body: IMember.IJoin"),
    true,
  );
};
