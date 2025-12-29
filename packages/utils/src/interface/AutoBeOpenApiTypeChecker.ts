import { AutoBeOpenApi } from "@autobe/interface";
import { OpenApiTypeChecker } from "@samchon/openapi";

export namespace AutoBeOpenApiTypeChecker {
  export const isArray = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.IArray => schema.type === "array";

  export const isObject = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.IObject => schema.type === "object";

  export const isOneOf = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.IOneOf => schema.type === "oneOf";

  export const isReference = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.IReference =>
    schema.type === "reference";

  export const isConst = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.IConstant =>
    schema.type === "constant";

  export const isInteger = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.IInteger => schema.type === "integer";

  export const isNumber = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.INumber => schema.type === "number";

  export const isString = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.IString => schema.type === "string";

  export const visit = (props: {
    components: AutoBeOpenApi.IComponents;
    schema: AutoBeOpenApi.IJsonSchema;
    closure: (schema: AutoBeOpenApi.IJsonSchema, accessor: string) => void;
  }): void =>
    OpenApiTypeChecker.visit({
      components: props.components,
      schema: props.schema,
      closure: (schema, accessor) => {
        props.closure(schema as any, accessor);
      },
    });

  export const skim = (props: {
    closure: (schema: AutoBeOpenApi.IJsonSchema, accessor: string) => void;
    schema: AutoBeOpenApi.IJsonSchema;
    accessor: string;
  }): void => {
    props.closure(props.schema, props.accessor);
    if (isOneOf(props.schema))
      props.schema.oneOf.forEach((sub, index) =>
        skim({
          closure: props.closure,
          schema: sub,
          accessor: `${props.accessor}.oneOf[${index}]`,
        }),
      );
    else if (isArray(props.schema))
      skim({
        closure: props.closure,
        schema: props.schema.items,
        accessor: `${props.accessor}.items`,
      });
    else if (isObject(props.schema)) {
      if (
        typeof props.schema.additionalProperties === "object" &&
        props.schema.additionalProperties !== null
      )
        skim({
          closure: props.closure,
          schema: props.schema.additionalProperties,
          accessor: `${props.accessor}.additionalProperties`,
        });
      for (const [key, value] of Object.entries(props.schema.properties))
        if (value)
          skim({
            closure: props.closure,
            schema: value,
            accessor: `${props.accessor}.properties[${JSON.stringify(key)}]`,
          });
    }
  };
}
