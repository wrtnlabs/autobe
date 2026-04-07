import { writeRealizeOperationTemplate } from "@autobe/agent/src/orchestrate/realize/programmers/internal/writeRealizeOperationTemplate";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { createMockOperation } from "./internal/createMockOperation";
import { createMockScenario } from "./internal/createMockScenario";
import { createMockTransformer } from "./internal/createMockTransformer";

interface IUser {
  id: string & tags.Format<"uuid">;
  name: string;
}

interface IProfile {
  bio: string;
  user: IUser | null;
  tags: Array<IUser> | null;
}

export const test_realize_operation_template_object_response_nullable =
  (): void => {
    const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
      typia.json.schemas<[IProfile, IUser]>().components.schemas as Record<
        string,
        AutoBeOpenApi.IJsonSchemaDescriptive
      >;

    const operation: AutoBeOpenApi.IOperation = createMockOperation({
      method: "get",
      path: "/profile",
      responseBody: { typeName: "IProfile" },
    });

    const result: string = writeRealizeOperationTemplate({
      scenario: createMockScenario(operation),
      operation,
      imports: [],
      authorization: null,
      schemas,
      collectors: [],
      transformers: [
        createMockTransformer({
          dtoTypeName: "IUser",
          databaseSchemaName: "users",
        }),
      ],
    });

    const expectedBody: string = StringUtil.trim`
      export async function getTest(): Promise<IProfile> {
        return {
          bio: ...,
          user: await UserTransformer.transform(...),
          tags: await ArrayUtil.asyncMap(..., (r) => UserTransformer.transform(r)),
        };
      }
    `;

    const normalize = (s: string): string =>
      s
        .split("\n")
        .map((l) => l.trimStart())
        .join("\n");
    TestValidator.equals(
      "full body",
      normalize(result).includes(normalize(expectedBody)),
      true,
    );
  };
