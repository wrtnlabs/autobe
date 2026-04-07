import { AutoBeRealizeTransformerProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeTransformerProgrammer";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

/**
 * Verifies that `computeNeighborRelations` correctly resolves:
 *
 * - Direct $ref → belongsTo (non-nullable)
 * - Array of $ref → hasMany
 * - OneOf with $ref and null → nullable belongsTo
 * - Unmatched neighbor (no relation entry) → excluded
 * - Unmatched relation (no DTO property) → excluded
 */
interface IPost {
  id: string & tags.Format<"uuid">;
  author: IAuthor;
  tags: ITag[];
  category: ICategory | null;
  title: string;
}

interface IAuthor {
  id: string & tags.Format<"uuid">;
  name: string;
}

interface ITag {
  id: string & tags.Format<"uuid">;
  label: string;
}

interface ICategory {
  id: string & tags.Format<"uuid">;
  name: string;
}

export const test_realize_transformer_template_compute_neighbor_relations =
  (): void => {
    const raw = typia.json.schemas<[IPost]>().components;
    const schemas = raw.schemas as Record<string, AutoBeOpenApi.IJsonSchema>;
    const schema = schemas[
      "IPost"
    ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject;

    const result = AutoBeRealizeTransformerProgrammer.computeNeighborRelations({
      schema,
      neighbors: [
        {
          type: "transformer",
          dtoTypeName: "IAuthor",
          thinking: "test",
          databaseSchemaName: "authors",
        },
        {
          type: "transformer",
          dtoTypeName: "ITag",
          thinking: "test",
          databaseSchemaName: "tags",
        },
        {
          type: "transformer",
          dtoTypeName: "ICategory",
          thinking: "test",
          databaseSchemaName: "categories",
        },
        // No matching relation → excluded
        {
          type: "transformer",
          dtoTypeName: "IOrphan",
          thinking: "test",
          databaseSchemaName: "orphans",
        },
      ],
      relations: [
        {
          propertyKey: "writer",
          targetModel: "authors",
          relationType: "belongsTo",
          fkColumns: "author_id",
        },
        {
          propertyKey: "postTags",
          targetModel: "tags",
          relationType: "hasMany",
          fkColumns: "-",
        },
        {
          propertyKey: "cat",
          targetModel: "categories",
          relationType: "belongsTo",
          fkColumns: "category_id",
        },
      ],
    });

    TestValidator.equals("neighbor relations", result, [
      {
        dtoProperty: "author",
        relationKey: "writer",
        transformerName: "AuthorTransformer",
        isArray: false,
        isNullable: false,
      },
      {
        dtoProperty: "tags",
        relationKey: "postTags",
        transformerName: "TagTransformer",
        isArray: true,
        isNullable: false,
      },
      {
        dtoProperty: "category",
        relationKey: "cat",
        transformerName: "CategoryTransformer",
        isArray: false,
        isNullable: true,
      },
    ]);
  };
