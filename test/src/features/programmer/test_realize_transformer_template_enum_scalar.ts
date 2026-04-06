import { AutoBeRealizeTransformerProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeTransformerProgrammer";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

/**
 * Enum / constant properties must be treated as scalar:
 *
 * - `status: "draft" | "published" | "archived"` is a oneOf of const values
 * - `priority: "low" | "high" | null` is a nullable enum
 *
 * Both should produce `true` in select, not `...`.
 */
interface ITask {
  id: string & tags.Format<"uuid">;
  title: string;
  status: "draft" | "published" | "archived";
  priority: "low" | "high" | null;
}

export const test_realize_transformer_template_enum_scalar = (): void => {
  const raw = typia.json.schemas<[ITask]>().components;
  const schemas = raw.schemas as Record<string, AutoBeOpenApi.IJsonSchema>;
  const schema = schemas[
    "ITask"
  ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject;

  const result = AutoBeRealizeTransformerProgrammer.writeTemplate({
    plan: {
      type: "transformer",
      dtoTypeName: "ITask",
      thinking: "test",
      databaseSchemaName: "tasks",
    },
    schema,
    schemas,
    neighbors: [],
    relations: [],
  });

  // All properties are scalar (including enum oneOf) → no `...`
  TestValidator.equals(
    "enum select: no ellipsis",
    result.includes("..."),
    false,
  );
  TestValidator.equals(
    "enum select: status is true",
    result.includes("status: true,"),
    true,
  );
  TestValidator.equals(
    "enum select: priority is true",
    result.includes("priority: true,"),
    true,
  );
};
