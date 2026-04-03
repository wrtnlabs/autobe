import { writeRealizeOperationTemplate } from "@autobe/agent/src/orchestrate/realize/programmers/internal/writeRealizeOperationTemplate";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { createMockAuthorization } from "./internal/createMockAuthorization";
import { createMockOperation } from "./internal/createMockOperation";
import { createMockScenario } from "./internal/createMockScenario";

interface IArticle {
  id: string & tags.Format<"uuid">;
  title: string;
}

export const test_realize_operation_template_authorization = (): void => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    typia.json.schemas<[IArticle]>().components.schemas as Record<
      string,
      AutoBeOpenApi.IJsonSchemaDescriptive
    >;

  const operation: AutoBeOpenApi.IOperation = createMockOperation({
    method: "get",
    path: "/articles",
    responseBody: { typeName: "IArticle" },
  });

  const authorization = createMockAuthorization({
    actorName: "member",
    payloadName: "MemberPayload",
  });

  const result: string = writeRealizeOperationTemplate({
    scenario: createMockScenario(operation),
    operation,
    imports: [],
    authorization,
    schemas,
    collectors: [],
    transformers: [],
  });

  TestValidator.equals(
    "authorization actor param",
    result.includes("member: MemberPayload"),
    true,
  );
  TestValidator.equals("has props wrapper", result.includes("props: {"), true);
};
