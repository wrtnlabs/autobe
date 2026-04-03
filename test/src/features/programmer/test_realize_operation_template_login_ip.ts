import { writeRealizeOperationTemplate } from "@autobe/agent/src/orchestrate/realize/programmers/internal/writeRealizeOperationTemplate";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { createMockCollector } from "./internal/createMockCollector";
import { createMockOperation } from "./internal/createMockOperation";
import { createMockScenario } from "./internal/createMockScenario";

namespace IMember {
  export interface ILogin {
    email: string;
    password: string;
  }
}

export const test_realize_operation_template_login_ip = (): void => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    typia.json.schemas<[IMember.ILogin]>().components.schemas as Record<
      string,
      AutoBeOpenApi.IJsonSchemaDescriptive
    >;

  const operation: AutoBeOpenApi.IOperation = createMockOperation({
    method: "post",
    path: "/auth/login",
    requestBody: { typeName: "IMember.ILogin" },
  });

  const result: string = writeRealizeOperationTemplate({
    scenario: createMockScenario(operation),
    operation,
    imports: [],
    authorization: null,
    schemas,
    collectors: [
      createMockCollector({
        dtoTypeName: "IMember.ILogin",
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
    result.includes("body: IMember.ILogin"),
    true,
  );
};
