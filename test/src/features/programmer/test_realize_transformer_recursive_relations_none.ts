import { AutoBeRealizeTransformerProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeTransformerProgrammer";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

/**
 * A plain DTO with no self-referencing properties. getRecursiveRelations must
 * return { parent: null, children: null }.
 */
interface IArticle {
  id: string & tags.Format<"uuid">;
  title: string;
  body: string;
  created_at: string & tags.Format<"date-time">;
}

export const test_realize_transformer_recursive_relations_none = (): void => {
  const schemas = typia.json.schemas<[IArticle]>().components.schemas as Record<
    string,
    AutoBeOpenApi.IJsonSchema
  >;

  const result = AutoBeRealizeTransformerProgrammer.getRecursiveRelations({
    schemas,
    typeName: "IArticle",
  });

  TestValidator.equals(
    "parent is null for non-recursive DTO",
    result.parent,
    null,
  );
  TestValidator.equals(
    "children is null for non-recursive DTO",
    result.children,
    null,
  );
};
