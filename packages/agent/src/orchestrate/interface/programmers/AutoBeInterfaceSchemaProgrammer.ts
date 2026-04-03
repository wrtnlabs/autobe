import {
  AutoBeDatabase,
  AutoBeInterfaceSchemaDesign,
  AutoBeOpenApi,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { LlmTypeChecker, NamingConvention } from "@typia/utils";
import { plural } from "pluralize";
import { ILlmApplication, ILlmFunction, ILlmSchema, IValidation } from "typia";

import { AutoBeDatabaseModelProgrammer } from "../../prisma/programmers/AutoBeDatabaseModelProgrammer";
import { AutoBeJsonSchemaValidator } from "../utils/AutoBeJsonSchemaValidator";

export namespace AutoBeInterfaceSchemaProgrammer {
  export interface IDatabaseSchemaMember {
    key: string;
    nullable: boolean;
    /**
     * Database column type for type compatibility validation.
     *
     * - `null` means this member is a relation (object/array), not a column, so
     *   primitive type checking should be skipped.
     */
    type: AutoBeDatabase.IPlainField["type"] | null;
  }

  export const getDatabaseSchemaName = (typeName: string): string =>
    plural(NamingConvention.snake(typeName.split(".")[0]!.substring(1)));

  export const getNeighborDatabaseSchemas = (props: {
    typeName: string;
    application: AutoBeDatabase.IApplication;
  }): AutoBeDatabase.IModel[] | undefined => {
    const expected: string = getDatabaseSchemaName(props.typeName);
    const found: AutoBeDatabase.IModel | undefined = props.application.files
      .flatMap((f) => f.models)
      .find((m) => m.name === expected);
    if (found === undefined) return;
    return AutoBeDatabaseModelProgrammer.getNeighbors({
      application: props.application,
      model: found,
    });
  };

  export const getDatabaseSchemaProperties = (props: {
    everyModels: AutoBeDatabase.IModel[];
    model: AutoBeDatabase.IModel;
  }): IDatabaseSchemaMember[] => [
    // Primary key
    {
      key: props.model.primaryField.name,
      nullable: false,
      type: "uuid",
    },
    // Plain fields (columns like title, description, created_at, etc.)
    ...props.model.plainFields.map((f) => ({
      key: f.name,
      nullable: f.nullable,
      type: f.type,
    })),
    // Foreign key columns (e.g., todo_app_user_id)
    ...props.model.foreignFields.map((f) => ({
      key: f.name,
      nullable: f.nullable,
      type: "uuid" as const,
    })),
    // Foreign key relation names (e.g., user) — relations, not columns
    ...props.model.foreignFields.map((f) => ({
      key: f.relation.name,
      nullable: f.nullable,
      type: null,
    })),
    // Opposite relations from other models — relations, not columns
    ...props.everyModels
      .map((m) =>
        m.foreignFields
          .filter((f) => f.relation.targetModel === props.model.name)
          .map((f) => ({
            key: f.relation.oppositeName,
            nullable: f.unique,
            type: null,
          })),
      )
      .flat(),
  ];

  export const validate = (props: {
    // common
    errors: IValidation.IError[];
    path: string;
    everyModels: AutoBeDatabase.IModel[];
    operations: AutoBeOpenApi.IOperation[];
    // specific
    typeName: string;
    design: AutoBeInterfaceSchemaDesign;
  }): void => {
    AutoBeJsonSchemaValidator.validateSchema({
      errors: props.errors,
      operations: props.operations,
      typeName: props.typeName,
      schema: props.design.schema,
      path: `${props.path}.schema`,
    });
    if (
      props.design.databaseSchema !== null &&
      props.everyModels.some((m) => m.name === props.design.databaseSchema) ===
        false
    )
      props.errors.push({
        path: `${props.path}.databaseSchema`,
        expected: props.everyModels
          .map((m) => JSON.stringify(m.name))
          .join(" | "),
        value: props.design.databaseSchema,
        description: StringUtil.trim`
          You set "databaseSchema" to ${JSON.stringify(props.design.databaseSchema)},
          but no database model with that name exists.

          Available database models are:
          ${props.everyModels.map((m) => `- ${m.name}`).join("\n")}

          Fix: Use one of the available model names above, or set to null
          if this type does not map to a single database table (e.g.,
          computed/aggregated types, types composed purely by business logic,
          or embedded JSON structures).
        `,
      });
  };

  export const fixApplication = (props: {
    application: ILlmApplication;
    everyModels: AutoBeDatabase.IModel[];
  }): void => {
    const func: ILlmFunction = props.application.functions[0];
    fixDatabaseSchema({
      $defs: func.parameters.$defs,
      parameters: func.parameters,
      everyModels: props.everyModels,
    });
  };

  const fixDatabaseSchema = (props: {
    $defs: Record<string, ILlmSchema>;
    parameters: ILlmSchema.IParameters;
    everyModels: AutoBeDatabase.IModel[];
  }): void => {
    LlmTypeChecker.visit({
      $defs: props.$defs,
      schema: props.parameters,
      closure: (next) => {
        if (LlmTypeChecker.isObject(next) === false) return;

        const member: ILlmSchema | undefined = next.properties.databaseSchema;
        if (member === undefined || LlmTypeChecker.isAnyOf(member) === false)
          return;

        const value: ILlmSchema | undefined = member.anyOf.find((x) =>
          LlmTypeChecker.isString(x),
        );
        if (value === undefined) return;
      },
    });
  };
}
