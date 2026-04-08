import { AutoBeRealizeTransformerProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeTransformerProgrammer";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

/**
 * # A DTO with a nullable N:1 self-reference (parent property).
 *
 * GetRecursiveRelations must detect the parent property and return null for
 * children.
 */
interface ICategory {
  id: string & tags.Format<"uuid">;
  name: string;
  parent: ICategory | null;
}

export const test_realize_transformer_recursive_relations_parent_only =
  (): void => {
    const schemas = typia.json.schemas<[ICategory]>().components
      .schemas as Record<string, AutoBeOpenApi.IJsonSchema>;

    const result = AutoBeRealizeTransformerProgrammer.getRecursiveRelations({
      schemas,
      typeName: "ICategory",
    });

    TestValidator.equals(
      "parent property name is 'parent'",
      result.parent,
      "parent",
    );
    TestValidator.equals(
      "no children property for parent-only DTO",
      result.children,
      null,
    );
  };
