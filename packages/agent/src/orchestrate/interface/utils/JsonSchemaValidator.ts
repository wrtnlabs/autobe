import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import { OpenApiTypeChecker } from "@samchon/openapi";
import { IValidation } from "typia";
import { Escaper } from "typia/lib/utils/Escaper";

import { JsonSchemaFactory } from "./JsonSchemaFactory";

export namespace JsonSchemaValidator {
  export const isObjectType = (props: {
    operations: AutoBeOpenApi.IOperation[];
    typeName: string;
  }): boolean =>
    props.typeName.endsWith(".IAuthorized") ||
    props.typeName.endsWith(".IRequest") ||
    props.typeName.endsWith(".ISummary") ||
    props.typeName.endsWith(".IInvert") ||
    props.typeName.endsWith(".ICreate") ||
    props.typeName.endsWith(".IUpdate") ||
    props.typeName.endsWith(".IJoin") ||
    props.typeName.endsWith(".ILogin") ||
    props.typeName.endsWith(".IAuthorized") ||
    props.operations.some(
      (op) =>
        op.requestBody?.typeName === props.typeName ||
        op.responseBody?.typeName === props.typeName,
    );

  export const isPage = (key: string): boolean =>
    key.startsWith("IPage") === true &&
    key.startsWith("IPage.") === false &&
    key !== "IPage";

  export const isPreset = (typeName: string): boolean =>
    JsonSchemaFactory.DEFAULT_SCHEMAS[typeName] !== undefined ||
    JsonSchemaValidator.isPage(typeName) === true ||
    typeName.endsWith(".IAuthorized") === true;

  export interface IProps {
    errors: IValidation.IError[];
    prismaSchemas: Set<string>;
    operations: AutoBeOpenApi.IOperation[];
    typeName: string;
    schema: AutoBeOpenApi.IJsonSchemaDescriptive;
    path: string;
  }

  export const validateSchema = (props: IProps): void => {
    const vo = validateObjectType({
      errors: props.errors,
      operations: props.operations,
      path: props.path,
    });
    validateAuthorization(props);
    validatePrismaSchema(props);
    validateRecursive(props);
    validateNullable(props.errors);
    validateTypeArray(props.errors);

    const key: string = props.typeName;
    const value: AutoBeOpenApi.IJsonSchemaDescriptive = props.schema;
    validateKey({
      errors: props.errors,
      path: `${props.path}[${JSON.stringify(key)}]`,
      key,
    });
    vo(key, value);
    OpenApiTypeChecker.visit({
      components: { schemas: { [key]: value } },
      schema: value,
      closure: (next, accessor) => {
        if (OpenApiTypeChecker.isReference(next) === false) return;
        const key: string = next.$ref.split("/").pop()!;
        validateKey({
          errors: props.errors,
          path: `${accessor}.$ref`,
          key,
          transform: (typeName) => `#/components/schemas/${typeName}`,
        });
      },
      accessor: `${props.path}[${JSON.stringify(key)}]`,
    });
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
    const key: string = props.typeName;
    const value: AutoBeOpenApi.IJsonSchemaDescriptive = props.schema;
    if (!key.endsWith(".IAuthorized")) return;
    else if (AutoBeOpenApiTypeChecker.isObject(value) === false) {
      props.errors.push({
        path: `${props.path}.${key}`,
        expected: `AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema.IObject>`,
        value: value,
        description: `${key} must be an object type for authorization responses`,
      });
      return;
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
  };

  const validatePrismaSchema = (props: IProps): void => {
    // fulfill error messages for "x-autobe-prisma-schema" misplacement
    for (const e of props.errors) {
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
    // check prisma schema existence
    const key: string = props.typeName;
    const value: AutoBeOpenApi.IJsonSchemaDescriptive = props.schema;
    AutoBeOpenApiTypeChecker.skim({
      schema: value,
      accessor: `${props.path}[${JSON.stringify(key)}]`,
      closure: (schema, accessor) => {
        if (AutoBeOpenApiTypeChecker.isObject(schema) === false) return;
        else if (
          schema["x-autobe-prisma-schema"] !== null &&
          schema["x-autobe-prisma-schema"] !== undefined &&
          props.prismaSchemas.has(schema["x-autobe-prisma-schema"]) === false
        )
          props.errors.push({
            path: accessor,
            expected: Array.from(props.prismaSchemas)
              .map((s) => JSON.stringify(s))
              .join(" | "),
            value: schema["x-autobe-prisma-schema"],
            description: StringUtil.trim`
              You've referenced a non-existing Prisma schema name
              ${JSON.stringify(schema["x-autobe-prisma-schema"])} in
              "x-autobe-prisma-schema" property.

              Make sure that the referenced Prisma schema name exists
              in your Prisma schema files.

              Existing Prisma schema names are:
              - ${Array.from(props.prismaSchemas).join("\n- ")}
            `,
          });
      },
    });
  };

  const validateRecursive = (props: IProps): void => {
    const key: string = props.typeName;
    const value: AutoBeOpenApi.IJsonSchemaDescriptive = props.schema;
    const report = (description: string) =>
      props.errors.push({
        path: props.path,
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
  };

  const validateObjectType = (props: {
    errors: IValidation.IError[];
    operations: AutoBeOpenApi.IOperation[];
    path: string;
  }) => {
    const root: Set<string> = new Set();
    for (const o of props.operations) {
      if (o.requestBody) root.add(o.requestBody.typeName);
      if (o.responseBody) root.add(o.responseBody.typeName);
    }
    return (
      key: string,
      schema: AutoBeOpenApi.IJsonSchemaDescriptive,
    ): void => {
      if (AutoBeOpenApiTypeChecker.isObject(schema) === true) return;
      if (root.has(key))
        props.errors.push({
          path: props.path,
          expected: `AutoBeOpenApi.IJsonSchemaDescriptive.IObject`,
          value: schema,
          description: StringUtil.trim`
            Root schema types (used in requestBody or responseBody of operations)
            must be defined as object types. 
            
            This is the rule enforced to ensure consistent API design and to facilitate easier data handling.
            Even though you think that defining a non-object type is more convenient for your specific use case,
            just follow the rule without any resistance.

            Note that, this is not a recommendation, but an instruction you must follow.

            If current type is hard to be defined as an object type, just wrap it in an object type like below:

            \`\`\`typescript
            {
              value: T;
            }
            \`\`\`
          `,
        });
      else if (
        key.endsWith(".IAuthorized") ||
        key.endsWith(".IRequest") ||
        key.endsWith(".ISummary") ||
        key.endsWith(".IInvert") ||
        key.endsWith(".ICreate") ||
        key.endsWith(".IUpdate") ||
        key.endsWith(".IJoin") ||
        key.endsWith(".ILogin") ||
        key.endsWith(".IAuthorized")
      )
        props.errors.push({
          path: props.path,
          expected: `AutoBeOpenApi.IJsonSchemaDescriptive.IObject`,
          value: schema,
          description: StringUtil.trim`
            DTO type of .${key.split(".").pop()} suffix must be defined as an object type.

            This is the rule enforced to ensure consistent API design and to facilitate easier data handling.
            Even though you think that defining a non-object type is more convenient for your specific use case,
            just follow the rule without any resistance.

            Note that, this is not a recommendation, but an instruction you must follow.

            If current type is hard to be defined as an object type, just wrap it in an object type like below:

            \`\`\`typescript
            {
              value: T;
            }
            \`\`\`
          `,
        });
    };
  };

  const validateNullable = (errors: IValidation.IError[]): void => {
    for (const e of errors)
      if (e.path.endsWith(".nullable") && e.expected === "undefined")
        e.description = StringUtil.trim`
          The nullable property is not allowed in JSON Schema definitions.

          Instead, use "oneOf" with "null" type.
        `;
  };

  const validateTypeArray = (errors: IValidation.IError[]): void => {
    for (const e of errors) {
      if (e.path.endsWith(".type") && e.value instanceof Array)
        e.description = StringUtil.trim`
          The "type" property as an array is not allowed in JSON Schema definitions.

          Instead, use "oneOf" with multiple types.
        `;
      else if (
        e.expected.includes("AutoBeOpenApi.IJsonSchema") &&
        e.expected.includes("|") &&
        typeof e.value === "object" &&
        e.value !== null &&
        Array.isArray((e.value as any).type)
      )
        e.description = StringUtil.trim`
          The "type" property as an array is not allowed in JSON Schema definitions.

          Instead, use "oneOf" with multiple types.
        `;
    }
  };
}
