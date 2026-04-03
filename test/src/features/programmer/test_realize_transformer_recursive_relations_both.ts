import { AutoBeRealizeTransformerProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeTransformerProgrammer";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

/**
 * A DTO with both a nullable N:1 self-reference (parent) and a 1:N
 * self-reference (children array) — the typical bidirectional tree node.
 * getRecursiveRelations must detect both simultaneously.
 */
interface INode {
  id: string & tags.Format<"uuid">;
  name: string;
  parent: INode | null;
  children: INode[];
}

export const test_realize_transformer_recursive_relations_both = (): void => {
  const schemas = typia.json.schemas<[INode]>().components.schemas as Record<
    string,
    AutoBeOpenApi.IJsonSchema
  >;

  const result = AutoBeRealizeTransformerProgrammer.getRecursiveRelations({
    schemas,
    typeName: "INode",
  });

  TestValidator.equals(
    "parent property name is 'parent'",
    result.parent,
    "parent",
  );
  TestValidator.equals(
    "children property name is 'children'",
    result.children,
    "children",
  );
};
