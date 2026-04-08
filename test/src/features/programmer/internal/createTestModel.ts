import { AutoBeDatabase } from "@autobe/interface";

/**
 * Builds an `AutoBeDatabase.IModel` fixture for transformer template tests.
 *
 * Accepts a concise description and produces a fully-typed model object. Uses
 * `as any` casts for branded string patterns (SnakeCasePattern,
 * CamelCasePattern) since these are test fixtures.
 */
export function createTestModel(props: {
  name: string;
  plainFields?: Array<{
    name: string;
    type?: AutoBeDatabase.IPlainField["type"];
    nullable?: boolean;
  }>;
  foreignFields?: Array<{
    name: string;
    nullable?: boolean;
    unique?: boolean;
    relation: {
      name: string;
      targetModel: string;
      oppositeName: string;
      mappingName?: string;
    };
  }>;
}): AutoBeDatabase.IModel {
  return {
    name: props.name,
    description: `Test model: ${props.name}`,
    material: false,
    stance: "primary",
    primaryField: {
      name: "id",
      type: "uuid",
      description: "Primary key",
    },
    foreignFields: (props.foreignFields ?? []).map((fk) => ({
      name: fk.name,
      type: "uuid" as const,
      description: `FK to ${fk.relation.targetModel}`,
      relation: {
        name: fk.relation.name,
        targetModel: fk.relation.targetModel,
        oppositeName: fk.relation.oppositeName,
        mappingName: fk.relation.mappingName,
      },
      unique: fk.unique ?? false,
      nullable: fk.nullable ?? false,
    })),
    plainFields: (props.plainFields ?? []).map((f) => ({
      name: f.name,
      type: f.type ?? "string",
      description: `Field: ${f.name}`,
      nullable: f.nullable ?? false,
    })),
    uniqueIndexes: [],
    plainIndexes: [],
    ginIndexes: [],
  } as AutoBeDatabase.IModel;
}
