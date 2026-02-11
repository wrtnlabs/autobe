import {
  AutoBeDatabase,
  AutoBeInterfaceSchemaPropertyRevise,
  AutoBeOpenApi,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import { IValidation } from "typia";

import { AutoBeJsonSchemaValidator } from "../utils/AutoBeJsonSchemaValidator";
import { AutoBeInterfaceSchemaProgrammer } from "./AutoBeInterfaceSchemaProgrammer";

export namespace AutoBeInterfaceSchemaPropertyReviseProgrammer {
  export const validate = (props: {
    // config
    path: (i: number | string) => string;
    errors: IValidation.IError[];
    unionTypeName: string;
    noModelDescription: string;
    // database
    everyModels: AutoBeDatabase.IModel[];
    model: AutoBeDatabase.IModel | null;
    // dto
    typeName: string;
    schema: AutoBeOpenApi.IJsonSchema.IObject;
    revises: AutoBeInterfaceSchemaPropertyRevise[];
  }): void => {
    // check individual revises
    props.revises.forEach((revise, i) => {
      validateProperty({
        // config
        path: props.path(i),
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
        originalDtoSchema:
          revise.type !== "exclude"
            ? props.schema.properties[revise.key]
            : undefined,
      });
    });

    // check all properties are revised
    for (const key of Object.keys(props.schema.properties))
      if (
        props.revises.find(
          (revise) => revise.type !== "exclude" && revise.key === key,
        ) === undefined
      )
        props.errors.push({
          path: props.path(""),
          value: undefined,
          expected: `${props.unionTypeName} (key: ${JSON.stringify(key)})`,
          description: StringUtil.trim`
            Property ${JSON.stringify(key)} is defined in the schema, but not revised.

            You MUST provide a revise for EVERY property in the object schema.
          `,
        });

    // check all DB schema properties are revised
    if (props.model !== null) {
      const everyProperties: string[] =
        AutoBeInterfaceSchemaProgrammer.getDatabaseSchemaProperties({
          everyModels: props.everyModels,
          model: props.model,
        }).map((p) => p.key);
      for (const key of everyProperties)
        if (
          props.revises.find(
            (revise) => revise.databaseSchemaProperty === key,
          ) === undefined
        )
          props.errors.push({
            path: props.path(""),
            value: undefined,
            expected: `${props.unionTypeName} (databaseSchemaProperty: ${JSON.stringify(key)})`,
            description: StringUtil.trim`
              Database schema property ${JSON.stringify(key)} is defined in the 
              database schema, but not revised.

              You MUST provide a revise with "databaseSchemaProperty" referencing 
              every property in the database schema if a database schema is defined.
            `,
          });
    }
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
      props.revise.type !== "exclude" &&
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
        schema: props.schema,
        operations: [],
        path: `${props.path}.schema`,
        errors: props.errors,
      });

    // check database schema property
    const dbSchemaPropp:
      | AutoBeInterfaceSchemaProgrammer.IDatabaseSchemaMember
      | undefined = validateDatabaseSchemaProperty(props);
    if (dbSchemaPropp !== undefined)
      validateNullable({
        ...props,
        property: dbSchemaPropp,
      });
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
}
