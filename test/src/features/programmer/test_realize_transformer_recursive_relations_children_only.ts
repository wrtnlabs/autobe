import { AutoBeRealizeTransformerProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeTransformerProgrammer";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

/**
 * A DTO with a 1:N self-reference (children array property) but no parent
 * property. hasSelfRefArray must detect the array of self-refs.
 */
interface IFolder {
  id: string & tags.Format<"uuid">;
  name: string;
  children: IFolder[];
}

export const test_realize_transformer_recursive_relations_children_only =
  (): void => {
    const schemas = typia.json.schemas<[IFolder]>().components
      .schemas as Record<string, AutoBeOpenApi.IJsonSchema>;

    const result = AutoBeRealizeTransformerProgrammer.getRecursiveRelations({
      schemas,
      typeName: "IFolder",
    });

    TestValidator.equals(
      "no parent property for children-only DTO",
      result.parent,
      null,
    );
    TestValidator.equals(
      "children property name is 'children'",
      result.children,
      "children",
    );
  };
