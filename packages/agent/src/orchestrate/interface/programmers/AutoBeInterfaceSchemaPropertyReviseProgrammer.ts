import {
  AutoBeDatabase,
  AutoBeInterfaceSchemaPropertyExclude,
  AutoBeInterfaceSchemaPropertyRevise,
  AutoBeOpenApi,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import typia, { IValidation } from "typia";

import { AutoBeJsonSchemaValidator } from "../utils/AutoBeJsonSchemaValidator";
import { AutoBeInterfaceSchemaProgrammer } from "./AutoBeInterfaceSchemaProgrammer";

export namespace AutoBeInterfaceSchemaPropertyReviseProgrammer {
  export const validate = (props: {
    // config
    path: string;
    errors: IValidation.IError[];
    unionTypeName: string;
    noModelDescription: string;
    // database
    everyModels: AutoBeDatabase.IModel[];
    model: AutoBeDatabase.IModel | null;
    // dto
    typeName: string;
    schema: AutoBeOpenApi.IJsonSchema.IObject;
    excludes: AutoBeInterfaceSchemaPropertyExclude[];
    revises: AutoBeInterfaceSchemaPropertyRevise[];
  }): void => {
    // check individual revises
    props.revises.forEach((revise, i) => {
      validateProperty({
        // config
        path: `${props.path}.revises[${i}]`,
        errors: props.errors,
        unionTypeName: props.unionTypeName,
        noModelDescription: props.noModelDescription,
        // database
        everyModels: props.everyModels,
        model: props.model,
        // dto
        typeName: props.typeName,
        schema: props.schema,
        revise,
        originalDtoSchema: props.schema.properties[revise.key],
      });
    });

    // check all properties are revised
    for (const key of Object.keys(props.schema.properties))
      if (props.revises.find((revise) => revise.key === key) === undefined)
        props.errors.push({
          path: `${props.path}.revises[]`,
          value: undefined,
          expected: `${props.unionTypeName} (key: ${JSON.stringify(key)})`,
          description: StringUtil.trim`
            Property ${JSON.stringify(key)} is defined in the schema, but not revised.

            You MUST provide a revise for EVERY property in the object schema.
          `,
        });

    // check that at least one property survives after revisions
    if (
      props.revises.length > 0 &&
      props.revises.every((r) => r.type === "erase")
    )
      props.errors.push({
        path: `${props.path}.revises`,
        expected: "At least one non-erase revision to retain a property",
        value: props.revises.map((r) => r.type),
        description: StringUtil.trim`
          All revisions are "erase", which would leave the schema with zero
          properties. An object type used as a DTO must have at least one
          property — otherwise the downstream Realize stage will fail with
          TypeScript compilation errors (TS2339).

          Keep at least one property by using "depict", "create", or "update"
          instead of "erase" for the essential fields.

          Note that, this is not a recommendation, but an instruction you must follow.
        `,
      });

    if (props.model === null) return;

    // check all DB schema properties are revised
    const actual: Set<string> = new Set();
    const expected: string[] =
      AutoBeInterfaceSchemaProgrammer.getDatabaseSchemaProperties({
        everyModels: props.everyModels,
        model: props.model,
      }).map((p) => p.key);
    for (const e of props.excludes) actual.add(e.databaseSchemaProperty);
    for (const r of props.revises)
      if (r.databaseSchemaProperty !== null)
        actual.add(r.databaseSchemaProperty);
    for (const key of expected)
      if (actual.has(key) === false)
        props.errors.push({
          path: `${props.path}.excludes[]`,
          value: undefined,
          expected: `${typia.reflect.name<AutoBeInterfaceSchemaPropertyExclude>()} (databaseSchemaProperty: ${JSON.stringify(key)}), or ${props.unionTypeName} (databaseSchemaProperty: ${JSON.stringify(key)})`,
          description: StringUtil.trim`
            Database property ${JSON.stringify(key)} exists in model
            "${props.model.name}" but is not addressed in either "excludes"
            or "revises".

            Every database property must be explicitly accounted for. You have
            two options:

            1. If this property belongs in the DTO: add a revision in "revises"
               with databaseSchemaProperty: ${JSON.stringify(key)}

            2. If this property should NOT appear in the DTO: add an entry to
               "excludes" with databaseSchemaProperty: ${JSON.stringify(key)}
               and a reason explaining why (e.g., "internal field",
               "aggregation relation", "handled by separate endpoint")

            Do NOT omit database properties. Either map them or exclude them.
          `,
        });

    // check whether excluded are contained in revises
    props.revises.forEach((revise, i) => {
      if (revise.databaseSchemaProperty === null) return;

      const index: number = props.excludes.findIndex(
        (e) => e.databaseSchemaProperty === revise.databaseSchemaProperty,
      );
      if (index === -1) return;

      props.errors.push({
        path: `${props.path}.revises[${i}].databaseSchemaProperty`,
        expected: `not ${JSON.stringify(revise.databaseSchemaProperty)}, or remove ${props.path}.excludes[${index}]`,
        value: revise.databaseSchemaProperty,
        description: StringUtil.trim`
          Database property ${JSON.stringify(revise.databaseSchemaProperty)}
          appears in both "revises[${i}]" and "excludes[${index}]".

          A database property must be either excluded OR revised, never both.
          Choose one of the following actions:

          1. If this property belongs in the DTO: remove it from "excludes"
             and keep the revision in "revises"

          2. If this property should NOT appear in the DTO: remove this
             revision from "revises" (or set its databaseSchemaProperty
             to null) and keep the "excludes" entry
        `,
      });
    });
  };

  const validateProperty = (props: {
    // config
    path: string;
    errors: IValidation.IError[];
    unionTypeName: string;
    noModelDescription: string;
    // database
    everyModels: AutoBeDatabase.IModel[];
    model: AutoBeDatabase.IModel | null;
    // dto
    typeName: string;
    schema: AutoBeOpenApi.IJsonSchema.IObject;
    revise: AutoBeInterfaceSchemaPropertyRevise;
    originalDtoSchema:
      | AutoBeOpenApi.IJsonSchema
      | AutoBeOpenApi.IJsonSchemaProperty
      | undefined;
  }): void => {
    // check property key existence
    if (
      props.revise.type !== "create" &&
      props.schema.properties[props.revise.key] === undefined
    )
      props.errors.push({
        path: `${props.path}.key`,
        expected: Object.keys(props.schema.properties)
          .map((s) => JSON.stringify(s))
          .join(" | "),
        value: props.revise.key,
        description: StringUtil.trim`
          Property ${JSON.stringify(props.revise.key)} does not exist in schema.

          To ${props.revise.type} a property, it must exist in the object type.
        `,
      });

    // check schema correctness
    if (props.revise.type === "create" || props.revise.type === "update")
      AutoBeJsonSchemaValidator.validateSchema({
        typeName: props.typeName,
        schema: props.revise.schema,
        operations: [],
        path: `${props.path}.schema`,
        errors: props.errors,
      });

    // check database schema property
    const dbSchemaProp:
      | AutoBeInterfaceSchemaProgrammer.IDatabaseSchemaMember
      | undefined = validateDatabaseSchemaProperty(props);
    if (dbSchemaProp !== undefined) {
      validateNullable({
        ...props,
        property: dbSchemaProp,
      });
      validateType({
        path: props.path,
        errors: props.errors,
        property: dbSchemaProp,
        revise: props.revise,
        originalDtoSchema: props.originalDtoSchema,
      });
    }
  };

  const validateDatabaseSchemaProperty = (props: {
    path: string;
    errors: IValidation.IError[];
    everyModels: AutoBeDatabase.IModel[];
    model: AutoBeDatabase.IModel | null;
    revise: AutoBeInterfaceSchemaPropertyRevise;
    originalDtoSchema:
      | AutoBeOpenApi.IJsonSchema
      | AutoBeOpenApi.IJsonSchemaProperty
      | undefined;
    noModelDescription: string;
  }): AutoBeInterfaceSchemaProgrammer.IDatabaseSchemaMember | undefined => {
    const value: string | null = props.revise.databaseSchemaProperty;
    if (value === null) return undefined;
    else if (props.model === null) {
      props.errors.push({
        path: `${props.path}.databaseSchemaProperty`,
        expected: "null",
        value,
        description: props.noModelDescription,
      });
      return;
    }

    const databaseProperties: AutoBeInterfaceSchemaProgrammer.IDatabaseSchemaMember[] =
      AutoBeInterfaceSchemaProgrammer.getDatabaseSchemaProperties({
        everyModels: [props.model],
        model: props.model,
      });
    const found:
      | AutoBeInterfaceSchemaProgrammer.IDatabaseSchemaMember
      | undefined = databaseProperties.find((p) => p.key === value);
    if (found === undefined)
      props.errors.push({
        path: `${props.path}.databaseSchemaProperty`,
        expected: databaseProperties
          .map((p) => JSON.stringify(p.key))
          .join(" | "),
        value,
        description: StringUtil.trim`
          You have defined "databaseSchemaProperty" property with value
          ${JSON.stringify(value)} that does not match any property (column or relation)
          in the database schema "${props.model.name}".

          Available properties in "${props.model.name}" are:
          ${databaseProperties.map((dp) => `- ${dp.key}`).join("\n")}

          Choose one of the following actions:

          1. If you made a typo and a similar property exists above, correct it
          2. If this property is computed/aggregated or composed purely by
             business logic (not from DB), set the value to null
          3. If no similar property exists above, delete this property entirely
            from the schema - the property itself should not exist

          The database schema is the source of truth. If the column you expected
          does not exist, the property design is incorrect. Do not insist on
          non-existent columns or keep trying different names hoping one works.

          Note that, this is not a recommendation, but an instruction you must follow.
        `,
      });
    return found;
  };

  const validateNullable = (props: {
    path: string;
    errors: IValidation.IError[];
    originalDtoSchema: AutoBeOpenApi.IJsonSchema | undefined;
    property: AutoBeInterfaceSchemaProgrammer.IDatabaseSchemaMember;
    revise: AutoBeInterfaceSchemaPropertyRevise;
  }): void => {
    const nullable: boolean | null =
      props.revise.type === "create" || props.revise.type === "update"
        ? AutoBeOpenApiTypeChecker.isNullable(props.revise.schema)
        : props.revise.type === "nullish"
          ? props.revise.nullable
          : props.revise.type === "erase" ||
              props.originalDtoSchema === undefined
            ? null
            : AutoBeOpenApiTypeChecker.isNullable(props.originalDtoSchema);
    if (nullable === null) return;
    else if (props.property.nullable === false || nullable === true) return;
    else if (props.revise.type === "create" || props.revise.type === "update")
      props.errors.push({
        path: `${props.path}.schema`,
        expected: JSON.stringify(
          {
            oneOf: [
              ...(AutoBeOpenApiTypeChecker.isOneOf(props.revise.schema)
                ? props.revise.schema.oneOf
                : [
                    {
                      ...props.revise.schema,
                      ...({
                        description: undefined,
                        "x-autobe-specification": undefined,
                        "x-autobe-database-schema-property": undefined,
                      } satisfies Partial<
                        Pick<
                          AutoBeOpenApi.IJsonSchemaProperty,
                          | "description"
                          | "x-autobe-specification"
                          | "x-autobe-database-schema-property"
                        >
                      >),
                    },
                  ]),
              { type: "null" },
            ],
            ...{
              description: (
                props.revise.schema as AutoBeOpenApi.IJsonSchemaProperty
              ).description,
              "x-autobe-specification": (
                props.revise.schema as AutoBeOpenApi.IJsonSchemaProperty
              )["x-autobe-specification"],
              "x-autobe-database-schema-property": (
                props.revise.schema as AutoBeOpenApi.IJsonSchemaProperty
              )["x-autobe-database-schema-property"],
            },
          } satisfies AutoBeOpenApi.IJsonSchema.IOneOf,
          null,
          2,
        ),
        value: props.revise.schema,
        description: StringUtil.trim`
          The database column "${props.property.key}" is nullable, but your
          schema does not allow null. Wrap it with oneOf including
          { type: "null" } as shown in the expected value above.
        `,
      });
    else if (props.revise.type === "nullish")
      props.errors.push({
        path: `${props.path}.nullable`,
        expected: "true",
        value: props.revise.nullable,
        description: StringUtil.trim`
          The database column "${props.property.key}" is nullable, so
          "nullable" must be true. You set it to false.
        `,
      });
    else
      props.errors.push({
        path: props.path,
        expected:
          "AutoBeInterfaceSchemaPropertyNullish | AutoBeInterfaceSchemaPropertyUpdate",
        value: props.revise,
        description: StringUtil.trim`
          The database column "${props.property.key}" is nullable, but the
          current schema does not allow null.

          Use "nullish" type with nullable: true to fix nullability only,
          or use "update" type with a schema wrapped in oneOf including
          { type: "null" } if you also need to change the schema.
        `,
      });
  };

  const validateType = (props: {
    path: string;
    errors: IValidation.IError[];
    property: AutoBeInterfaceSchemaProgrammer.IDatabaseSchemaMember;
    revise: AutoBeInterfaceSchemaPropertyRevise;
    originalDtoSchema:
      | AutoBeOpenApi.IJsonSchema
      | AutoBeOpenApi.IJsonSchemaProperty
      | undefined;
  }): void => {
    // skip relations (object/array) — only validate primitive column types
    if (props.property.type === null) return;

    // extract the effective schema from the revise action
    const schema: AutoBeOpenApi.IJsonSchema | null =
      props.revise.type === "create" || props.revise.type === "update"
        ? props.revise.schema
        : props.revise.type === "erase" || props.originalDtoSchema === undefined
          ? null
          : props.originalDtoSchema;
    if (schema === null) return;

    // for oneOf: at least one non-null member must be type-compatible
    if (AutoBeOpenApiTypeChecker.isOneOf(schema)) {
      const nonNull = schema.oneOf.filter(
        (s) => !AutoBeOpenApiTypeChecker.isNull(s),
      );
      if (nonNull.length === 0) {
        // all-null oneOf (e.g., `null | null`)
        const expected = describeExpectedSchema(props.property.type);
        props.errors.push({
          path: `${props.path}.schema`,
          expected,
          value: schema,
          description: StringUtil.trim`
            Database column "${props.property.key}" has type "${props.property.type}",
            but the DTO property schema is a union of only null types
            (e.g., "null | null") which carries no actual type information.

            Expected JSON Schema: ${expected}.

            Fix: Replace the entire schema with the correct type for this column.
            If the column is nullable, wrap it as:
            { oneOf: [${expected}, { type: "null" }] }.
          `,
        });
      } else if (
        !nonNull.some(
          (s) =>
            props.property.type !== null &&
            isTypeCompatible(props.property.type, s),
        )
      ) {
        // no non-null member matches the DB column type
        const expected = describeExpectedSchema(props.property.type);
        props.errors.push({
          path: `${props.path}.schema`,
          expected,
          value: schema,
          description: StringUtil.trim`
            Database column "${props.property.key}" has type "${props.property.type}",
            so the JSON Schema must be: ${expected}.

            However, the DTO property declares an incompatible type:
            ${JSON.stringify(schema, null, 2)}.

            Fix: Replace the schema with ${expected}.
            If the column is nullable, wrap it as:
            { oneOf: [${expected}, { type: "null" }] }.

            The database schema is the source of truth — the DTO property type
            must be compatible with the underlying column type.
          `,
        });
      }
      return;
    }

    // non-oneOf: direct type check
    if (isTypeCompatible(props.property.type, schema)) return;

    const expected = describeExpectedSchema(props.property.type);
    props.errors.push({
      path: `${props.path}.schema`,
      expected,
      value: schema,
      description: StringUtil.trim`
        Database column "${props.property.key}" has type "${props.property.type}",
        which expects JSON Schema: ${expected}.

        However, the DTO property declares an incompatible type:
        ${JSON.stringify(schema, null, 2)}.

        Fix: Change the schema to match the database column type. The database
        schema is the source of truth — the DTO property type must be compatible
        with the underlying column type.
      `,
    });
  };

  /** Check whether a JSON Schema type is compatible with a database column type. */
  const isTypeCompatible = (
    dbType: AutoBeDatabase.IPlainField["type"],
    schema: AutoBeOpenApi.IJsonSchema,
  ): boolean => {
    switch (dbType) {
      case "boolean":
        return AutoBeOpenApiTypeChecker.isBoolean(schema);
      case "int":
        return AutoBeOpenApiTypeChecker.isInteger(schema);
      case "double":
        return AutoBeOpenApiTypeChecker.isNumber(schema);
      case "string":
        return AutoBeOpenApiTypeChecker.isString(schema);
      case "uuid":
        return (
          AutoBeOpenApiTypeChecker.isString(schema) && schema.format === "uuid"
        );
      case "uri":
        return (
          AutoBeOpenApiTypeChecker.isString(schema) &&
          (schema.format === "uri" || schema.format === "url")
        );
      case "datetime":
        return (
          AutoBeOpenApiTypeChecker.isString(schema) &&
          schema.format === "date-time"
        );
    }
  };

  /**
   * Human-readable description of the expected JSON Schema for a DB column
   * type.
   */
  const describeExpectedSchema = (
    dbType: AutoBeDatabase.IPlainField["type"],
  ): string => {
    switch (dbType) {
      case "boolean":
        return '{ type: "boolean" }';
      case "int":
        return '{ type: "integer" }';
      case "double":
        return '{ type: "number" }';
      case "string":
        return '{ type: "string" }';
      case "uuid":
        return '{ type: "string", format: "uuid" }';
      case "uri":
        return '{ type: "string", format: "uri" }';
      case "datetime":
        return '{ type: "string", format: "date-time" }';
    }
  };
}
