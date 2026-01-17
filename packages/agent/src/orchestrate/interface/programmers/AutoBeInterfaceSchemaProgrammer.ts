import {
  AutoBeInterfaceSchemaPropertyCreate,
  AutoBeInterfaceSchemaPropertyErase,
  AutoBeInterfaceSchemaPropertyNullish,
  AutoBeInterfaceSchemaPropertyRevise,
  AutoBeInterfaceSchemaPropertyUpdate,
  AutoBeOpenApi,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import { IValidation } from "typia";

export namespace AutoBeInterfaceSchemaProgrammer {
  export const validateRevise = (props: {
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    revise: AutoBeInterfaceSchemaPropertyRevise;
    path: string;
    errors: IValidation.IError[];
  }): void => {
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
  };

  export const reviseObjectType = (props: {
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    revises: AutoBeInterfaceSchemaPropertyRevise[];
  }): AutoBeOpenApi.IJsonSchemaDescriptive.IObject => {
    const result: AutoBeOpenApi.IJsonSchemaDescriptive.IObject = JSON.parse(
      JSON.stringify(props.schema),
    );
    for (const r of props.revises)
      if (r.type === "create") createObjectProperty(result, r);
      else if (r.type === "update") updateObjectProperty(result, r);
      else if (r.type === "erase") eraseObjectProperty(result, r);
      else if (r.type === "nullish") nullishObjectProperty(result, r);
      else r satisfies never;
    return result;
  };

  const createObjectProperty = (
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject,
    revise: AutoBeInterfaceSchemaPropertyCreate,
  ): void => {
    schema.properties[revise.key] = revise.schema;
    if (revise.required === true && !schema.required.includes(revise.key))
      schema.required.push(revise.key);
  };

  const updateObjectProperty = (
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject,
    revise: AutoBeInterfaceSchemaPropertyUpdate,
  ): void => {
    eraseObjectProperty(schema, {
      type: "erase",
      key: revise.key,
      reason: revise.reason,
    });
    createObjectProperty(schema, {
      type: "create",
      key: revise.newKey ?? revise.key,
      schema: revise.schema,
      required: revise.required,
      reason: revise.reason,
    });
  };

  const eraseObjectProperty = (
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject,
    revise: AutoBeInterfaceSchemaPropertyErase,
  ): void => {
    delete schema.properties[revise.key];
    if (schema.required.includes(revise.key))
      schema.required.splice(schema.required.indexOf(revise.key), 1);
  };

  const nullishObjectProperty = (
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject,
    revise: AutoBeInterfaceSchemaPropertyNullish,
  ): void => {
    const value: AutoBeOpenApi.IJsonSchemaDescriptive =
      schema.properties[revise.key];
    if (value === undefined) return;
    else if (revise.nullable === true) {
      if (AutoBeOpenApiTypeChecker.isOneOf(value)) {
        if (
          value.oneOf.some((item) => AutoBeOpenApiTypeChecker.isNull(item)) ===
          false
        )
          value.oneOf.push({ type: "null" });
      } else if (AutoBeOpenApiTypeChecker.isNull(value) === false)
        schema.properties[revise.key] = {
          description: value.description,
          oneOf: [
            {
              ...value,
              ...{
                description: undefined,
              },
            },
            { type: "null" },
          ],
        };
    } else if (revise.nullable === false) {
      if (AutoBeOpenApiTypeChecker.isOneOf(value)) {
        value.oneOf = value.oneOf.filter(
          (value) => AutoBeOpenApiTypeChecker.isNull(value) === false,
        );
        if (value.oneOf.length === 1)
          schema.properties[revise.key] = {
            ...value.oneOf[0],
            description: value.description,
          };
      }
    }
  };
}
