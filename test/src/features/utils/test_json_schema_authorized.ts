import { AutoBeJsonSchemaFactory } from "@autobe/agent/src/orchestrate/interface/utils/AutoBeJsonSchemaFactory";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

export const test_json_schema_authorized = (): void => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    typia.json.schemas<[IBbsMember, IBbsMember.IAuthorized]>().components
      .schemas as Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  AutoBeJsonSchemaFactory.authorize(schemas);

  const type: AutoBeOpenApi.IJsonSchemaDescriptive.IObject = schemas[
    "IBbsMember.IAuthorized"
  ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
  const expected: string[] = [
    "id",
    "email",
    "created_at",
    "activated",
    "token",
  ].sort();

  TestValidator.equals(
    "type.properties",
    Object.keys(type.properties).sort(),
    expected,
  );
  TestValidator.equals("type.required", type.required.sort(), expected);
};

interface IBbsMember {
  /** Primary Key. */
  id: string & tags.Format<"uuid">;

  /** Account email. */
  email: string & tags.Format<"email">;

  /** Creation time of the record. */
  created_at: string & tags.Format<"date-time">;
}
export namespace IBbsMember {
  export interface IAuthorized {
    activated: boolean;
  }
}
