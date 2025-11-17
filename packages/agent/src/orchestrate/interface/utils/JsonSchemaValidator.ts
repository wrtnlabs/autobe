import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import { OpenApiTypeChecker } from "@samchon/openapi";
import { IValidation } from "typia";
import { Escaper } from "typia/lib/utils/Escaper";

export namespace JsonSchemaValidator {
  export interface IProps {
    errors: IValidation.IError[];
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    path: string;
  }

  export const validateSchemas = (props: IProps): void => {
    validateAuthorization(props);
    validatePrismaSchema(props.errors);
    validateRecursive(props);
    for (const key of Object.keys(props.schemas)) {
      validateKey({
        errors: props.errors,
        path: `${props.path}[${JSON.stringify(key)}]`,
        key,
      });
      OpenApiTypeChecker.visit({
        components: { schemas: props.schemas },
        schema: props.schemas[key],
        closure: (next, accessor) => {
          if (OpenApiTypeChecker.isReference(next)) {
            validateKey({
              errors: props.errors,
              path: `${accessor}.$ref`,
              key: next.$ref.split("/").pop()!,
              transform: (typeName) => `#/components/schemas/${typeName}`,
            });
          }
        },
        accessor: `${props.path}[${JSON.stringify(key)}]`,
      });
    }
  };

  export const validateKey = (props: {
    errors: IValidation.IError[];
    key: string;
    path: string;
    transform?: (typeName: string) => string;
  }): void => {
    const transform = props.transform ?? ((typeName: string) => typeName);
    const elements: string[] = props.key.split(".");
    if (elements.every(Escaper.variable) === false)
      props.errors.push({
        path: props.path,
        expected: StringUtil.trim`
          Valid variable name

          ${elements.map((s) => `- ${s}: ${Escaper.variable(s) ? "valid" : "invalid"}`).join("\n")}
        `,
        value: transform(props.key),
        description: StringUtil.trim`
          JSON schema type name must be a valid variable name.

          Even though JSON schema type name allows dot(.) character, but
          each segment separated by dot(.) must be a valid variable name.

          Current key name ${transform(JSON.stringify(props.key))} is not valid. 
          Change it to a valid variable name at the next time.
        `,
      });
    if (props.key.endsWith(".IPage")) {
      const expected: string = `IPage${props.key.substring(0, props.key.length - 6)}`;
      props.errors.push({
        path: props.path,
        expected: `"IPage" must be followed by another interface name. Use ${transform(JSON.stringify(expected))} instead.`,
        value: transform(props.key),
        description: StringUtil.trim`
          "IPage" is a reserved type name for pagination response.
          The pagination data type name must be post-fixed after "IPage".
          
          However, you've defined ${transform(JSON.stringify(props.key))}, 
          post-fixing ".IPage" after the pagination data type name.

          Change it to a valid pagination type name to be
          ${transform(JSON.stringify(expected))} at the next time. 
          Note that, this is not a recommendation, but an instruction you must follow.
        `,
      });
    } else if (props.key === "IPageIRequest")
      props.errors.push({
        path: props.path,
        expected: `"IPageIRequest" is a mistake. Use "IPage.IRequest" instead.`,
        value: transform(props.key),
        description: StringUtil.trim`
          You've taken a mistake that defines "${transform("IPageIRequest")}" as a type name.
          However, as you've intended to define a pagination request type, 
          the correct type name is "${transform("IPage.IRequest")}" instead of "${transform("IPageIRequest")}".

          Change it to "${transform("IPage.IRequest")}" at the next time.
        `,
      });
    else if (
      props.key.startsWith("IPage") &&
      props.key.startsWith("IPageI") === false &&
      props.key !== "IPage.IPagination" &&
      props.key !== "IPage.IRequest"
    ) {
      const expected: string = `IPage${props.key
        .substring(5)
        .split(".")
        .map((s) => (s.startsWith("I") ? s : `I${s}`))
        .join(".")}`;
      props.errors.push({
        path: props.path,
        expected: `Interface name starting with 'I' even after 'IPage': ${JSON.stringify(expected)}`,
        value: transform(props.key),
        description: StringUtil.trim`
          JSON schema type name must be an interface name starting with 'I'.
          Even though JSON schema type name allows dot(.) character, but
          each segment separated by dot(.) must be an interface name starting
          with 'I'.

          Even in the case of pagination response, after 'IPage' prefix,
          the remaining part must be an interface name starting with 'I'.
          
          Current key name ${JSON.stringify(props.key)} is not valid. Change
          it to a valid interface name to be  ${JSON.stringify(expected)},
          or change it to another valid interface name at the next time.
        `,
      });
    } else if (elements.some((s) => s.startsWith("I") === false) === true) {
      const expected: string = elements
        .map((s) => (s.startsWith("I") ? s : `I${s}`))
        .join(".");
      props.errors.push({
        path: props.path,
        expected: `Interface name starting with 'I': ${JSON.stringify(expected)}`,
        value: transform(props.key),
        description: StringUtil.trim`
          JSON schema type name must be an interface name starting with 'I'.
          Even though JSON schema type name allows dot(.) character, but
          each segment separated by dot(.) must be an interface name starting
          with 'I'.

          Current key name ${transform(JSON.stringify(props.key))} is not valid. 
          Change it to a valid interface name to be ${transform(JSON.stringify(expected))}, 
          or change it to another valid interface name at the next time.

          Note that, this is not a recommendation, but an instruction you must follow.
        `,
      });
    }
  };

  const validateAuthorization = (props: IProps): void => {
    for (const [key, value] of Object.entries(props.schemas)) {
      if (!key.endsWith(".IAuthorized")) continue;
      else if (AutoBeOpenApiTypeChecker.isObject(value) === false) {
        props.errors.push({
          path: `${props.path}.${key}`,
          expected: `AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema.IObject>`,
          value: value,
          description: `${key} must be an object type for authorization responses`,
        });
        continue;
      }

      // Check if token property exists
      value.properties ??= {};
      value.properties["token"] = {
        $ref: "#/components/schemas/IAuthorizationToken",
        description: "JWT token information for authentication",
      } as AutoBeOpenApi.IJsonSchemaDescriptive.IReference;

      value.required ??= [];
      if (value.required.includes("token") === false)
        value.required.push("token");
    }
  };

  const validatePrismaSchema = (errors: IValidation.IError[]): void => {
    for (const e of errors) {
      if (e.path.endsWith(`.properties["x-autobe-prisma-schema"]`) === false)
        continue;
      e.expected =
        "undefined value (remove this property and re-define it in the root schema)";
      e.description = StringUtil.trim`
        You have defined a property named "x-autobe-prisma-schema"
        somewhere wrong place.
        
        You have defined a property name "x-autobe-prisma-schema" as 
        an object type. However, this "x-autobe-prisma-schema" property
        must be defined only in the root schema object as a metadata,
        not in the nested object property.

        Remove this property at the next time, and re-define it in the
        root object schema.
        
        - Current path (wrong): ${e.path}
        - Must be (object root): ${e.path.replace(
          `.properties["x-autobe-prisma-schema"]`,
          `["x-autobe-prisma-schema"]`,
        )} 
      `;
    }
  };

  const validateRecursive = (props: IProps): void => {
    for (const [key, value] of Object.entries(props.schemas)) {
      const report = (description: string) =>
        props.errors.push({
          path: `${props.path}[${JSON.stringify(key)}]`,
          expected: "Non-infinite recursive schema definition",
          value,
          description,
        });
      if (
        AutoBeOpenApiTypeChecker.isReference(value) &&
        value.$ref === `#/components/schemas/${key}`
      )
        report(StringUtil.trim`
          You have defined a nonsensible type like below:

          \`\`\`typescript
          type ${key} = ${key};
          \`\`\`

          This is an infinite recursive type definition that cannot exist in any
          programming language. A type cannot be defined as itself - this creates
          a circular definition with no base case, making the type impossible to
          instantiate or validate.

          If you need tree or graph structures, use explicit relationships with
          ID references (e.g., parentId: string) instead of recursive type definitions.
          Remove the self-reference and redesign the schema at the next time.
        `);
      else if (
        AutoBeOpenApiTypeChecker.isArray(value) &&
        AutoBeOpenApiTypeChecker.isReference(value.items) &&
        value.items.$ref === `#/components/schemas/${key}`
      )
        report(StringUtil.trim`
          You have defined a nonsensible type like below:

          \`\`\`typescript
          type ${key} = Array<${key}>;
          \`\`\`

          This is an infinite recursive array type that cannot exist in any
          programming language. An array of itself creates a circular definition
          with no base case, making the type impossible to instantiate or validate.

          If you need nested structures, define explicit depth levels with separate
          types, or use parent-child relationships with ID references.
          Remove the self-reference and redesign the schema at the next time.
        `);
      else if (
        AutoBeOpenApiTypeChecker.isOneOf(value) &&
        value.oneOf.some(
          (v) =>
            AutoBeOpenApiTypeChecker.isReference(v) &&
            v.$ref === `#/components/schemas/${key}`,
        ) === true
      )
        report(StringUtil.trim`
          You have defined a nonsensible type like below:

          \`\`\`typescript
          type ${key} = ${key} | ...;
          \`\`\`

          This is an infinite recursive union type that cannot exist in any
          programming language. A union that includes itself as a variant creates
          a circular definition with no base case, making the type impossible to
          instantiate or validate.

          If you need polymorphic hierarchies, define separate concrete types for
          each variant without including the union type itself as a variant.
          Remove the self-reference and redesign the schema at the next time.
        `);
      else if (
        AutoBeOpenApiTypeChecker.isObject(value) &&
        value.properties &&
        value.required &&
        Object.entries(value.properties).some(
          ([k, v]) =>
            AutoBeOpenApiTypeChecker.isReference(v) &&
            v.$ref === `#/components/schemas/${key}` &&
            value.required.includes(k),
        )
      )
        report(StringUtil.trim`
          You have defined a nonsensible type like below:

          \`\`\`typescript
          interface ${key} {
            someProperty: ${key}; // required, non-nullable
          }
          \`\`\`

          This is an infinite recursive object type that cannot exist in any
          programming language. A required non-nullable property referencing its
          own type creates a circular definition with no base case, making the
          type impossible to instantiate.

          To create an instance of ${key}, you would need an instance of ${key},
          which requires another instance of ${key}, infinitely. This is logically
          impossible.

          If you need parent-child or graph relationships, make the self-referencing
          property either nullable or optional, or use ID references (e.g., parentId: string).
          Remove the required self-reference and redesign the schema at the next time.
        `);
    }
  };
}
