import { AutoBeRealizeTransformerProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeTransformerProgrammer";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

/**
 * A DTO with a non-nullable N:1 self-reference (direct $ref, no oneOf wrapper).
 * hasSelfRef must detect a bare $ref pointing to the same type.
 * getRecursiveRelations must return parent = "reply", children = null.
 */
interface IComment {
  id: string & tags.Format<"uuid">;
  body: string;
  reply: IComment;
}

export const test_realize_transformer_recursive_relations_parent_only_nonnullable =
  (): void => {
    const schemas = typia.json.schemas<[IComment]>().components
      .schemas as Record<string, AutoBeOpenApi.IJsonSchema>;

    const result = AutoBeRealizeTransformerProgrammer.getRecursiveRelations({
      schemas,
      typeName: "IComment",
    });

    TestValidator.equals(
      "non-nullable self-ref detected as parent",
      result.parent,
      "reply",
    );
    TestValidator.equals(
      "no children for non-nullable parent-only DTO",
      result.children,
      null,
    );
  };
