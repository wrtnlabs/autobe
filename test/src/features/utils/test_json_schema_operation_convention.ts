import { JsonSchemaNamingConvention } from "@autobe/agent/src/orchestrate/interface/utils/JsonSchemaNamingConvention";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

export const test_json_schema_operation_convention = () => {
  interface ITypeNamePair {
    requestBody: string | null;
    responseBody: string;
  }
  const pairs: ITypeNamePair[] = [
    {
      requestBody: "ICustomeruser.ILogin",
      responseBody: "ICustomerUser.IAuthorized",
    },
    {
      requestBody: "ICustomerUser.IJoin",
      responseBody: "ICustomeruser.IAuthorized",
    },
    {
      requestBody: null,
      responseBody: "ICustomeruser",
    },
  ];

  const operations: AutoBeOpenApi.IOperation[] = pairs.map(
    (p) =>
      ({
        ...typia.random<AutoBeOpenApi.IOperation>(),
        requestBody: p.requestBody
          ? {
              description: "request body",
              typeName: p.requestBody,
            }
          : null,
        responseBody: {
          description: "response body",
          typeName: p.responseBody,
        },
      }) satisfies AutoBeOpenApi.IOperation,
  );
  JsonSchemaNamingConvention.operations(operations);

  const typeNames: Set<string> = new Set();
  for (const op of operations) {
    if (op.requestBody) typeNames.add(op.requestBody.typeName);
    if (op.responseBody) typeNames.add(op.responseBody.typeName);
  }
  TestValidator.equals(
    "convention",
    Array.from(typeNames).sort(),
    [
      "ICustomerUser.IAuthorized",
      "ICustomerUser.IJoin",
      "ICustomerUser.ILogin",
      "ICustomerUser",
    ].sort(),
  );
};
