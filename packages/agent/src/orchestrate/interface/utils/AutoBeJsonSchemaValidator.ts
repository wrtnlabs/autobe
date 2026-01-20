import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import { IValidation } from "typia";
import { Escaper } from "typia/lib/utils/Escaper";

import { AutoBeJsonSchemaFactory } from "./AutoBeJsonSchemaFactory";

export namespace AutoBeJsonSchemaValidator {
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
    AutoBeJsonSchemaFactory.DEFAULT_SCHEMAS[typeName] !== undefined ||
    AutoBeJsonSchemaValidator.isPage(typeName) === true;

  export interface IProps {
    errors: IValidation.IError[];
    databaseSchemas: Set<string>;
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
    validateDatabaseSchema(props);
    validateRecursive(props);
    validateReferenceId(props);
    validatePropertyNames(props);

    vo(props.typeName, props.schema);
    AutoBeOpenApiTypeChecker.skim({
      schema: props.schema,
      closure: (next, accessor) => {
        if (AutoBeOpenApiTypeChecker.isReference(next) === false) return;
        const key: string = next.$ref.split("/").pop()!;
        validateKey({
          errors: props.errors,
          path: `${accessor}.$ref`,
          key,
          transform: (typeName) => `#/components/schemas/${typeName}`,
        });
      },
      accessor: `${props.path}[${JSON.stringify(props.typeName)}]`,
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
    if (elements.length > 2)
      props.errors.push({
        path: props.path,
        expected: "At most one dot(.) character allowed in type name",
        value: transform(props.key),
        description: StringUtil.trim`
          JSON schema type name allows at most one dot(.) character to separate
          module name and interface name.
          
          However, current key name ${transform(JSON.stringify(props.key))}
          contains multiple dot(.) characters (${elements.length - 1} times). 
          
          Change it to a valid type name with at most one dot(.) character at the next time.
        `,
      });
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
    }
    if (props.key === "IPageIRequest")
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
    if (
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
    }
    if (elements.some((s) => s.startsWith("I") === false) === true) {
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
    if (
      elements.length === 2 &&
      (elements[1] === "IJoin" ||
        elements[1] === "ILogin" ||
        elements[1] === "IAuthorized" ||
        elements[1] === "IRefresh") &&
      elements[0].endsWith("Session") === true
    )
      props.errors.push({
        path: props.path,
        expected: JSON.stringify(
          `${elements[0].replace("Session", "")}.${elements[1]}`,
        ),
        value: transform(props.key),
        description: StringUtil.trim`
          You have attached ${elements[1]} to a Session type ${transform(JSON.stringify(props.key))},
          but this is architecturally incorrect.

          In production authentication systems, Actor and Session are separate concepts:
          - **Actor** (e.g., User, Seller, Admin): The persistent user identity that performs
            authentication actions - joining (registering), logging in, and receiving authorized tokens.
          - **Session** (e.g., UserSession, SellerSession): The temporary authentication state that
            tracks active login instances. Sessions are CREATED as a result of join/login operations,
            but they do not perform these actions themselves.

          Think about it semantically: An ACTOR joins the system and logs in. A SESSION is merely
          a record that gets created when the actor authenticates. It makes no sense for a session
          to "join" or "login" - only actors do that.

          Therefore, authentication-related DTO types (IJoin, ILogin, IAuthorized, IRefresh) MUST
          be attached to the Actor type, NEVER to the Session type.

          Change ${transform(JSON.stringify(props.key))} to ${transform(JSON.stringify(`${elements[0].replace("Session", "")}.${elements[1]}`))} at the next time.

          This is an ABSOLUTE RULE with ZERO TOLERANCE. You MUST follow this instruction exactly.
        `,
      });
  };

  const validateAuthorization = (props: IProps): void => {
    if (props.typeName.endsWith(".IAuthorized") === true) {
      if (AutoBeOpenApiTypeChecker.isObject(props.schema) === false) {
        props.errors.push({
          path: `${props.path}[${JSON.stringify(props.typeName)}]`,
          expected: `AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema.IObject>`,
          value: props.schema,
          description: `${props.typeName} must be an object type for authorization responses`,
        });
      } else {
        // Check if token property exists
        props.schema.properties ??= {};
        props.schema.properties["token"] = {
          $ref: "#/components/schemas/IAuthorizationToken",
          description: "JWT token information for authentication",
        } as AutoBeOpenApi.IJsonSchemaDescriptive.IReference;

        props.schema.required ??= [];
        if (props.schema.required.includes("token") === false)
          props.schema.required.push("token");
      }
    }

    AutoBeOpenApiTypeChecker.skim({
      schema: props.schema,
      accessor: `${props.path}[${JSON.stringify(props.typeName)}]`,
      closure: (next, accessor) => {
        if (AutoBeOpenApiTypeChecker.isReference(next) === false) return;
        const key: string = next.$ref.split("/").pop()!;
        if (
          key.endsWith(".IAuthorized") === false &&
          key.endsWith(".ILogin") === false &&
          key.endsWith(".IJoin") === false
        )
          return;
        const candidates: Set<string> = new Set(
          props.operations
            .map((op) => [
              op.requestBody?.typeName.endsWith(key.split(".").pop()!)
                ? op.requestBody!.typeName
                : null,
              op.responseBody?.typeName.endsWith(key.split(".").pop()!)
                ? op.responseBody!.typeName
                : null,
            ])
            .flat()
            .filter((v) => v !== null),
        );
        if (candidates.has(key) === false)
          props.errors.push({
            path: `${accessor}.$ref`,
            expected: Array.from(candidates)
              .map((s) => JSON.stringify(`#/components/schemas/${s}`))
              .join(" | "),
            value: key,
            description: StringUtil.trim`
              You've referenced an authorization-related type ${JSON.stringify(key)} 
              that is not used in any operation's requestBody or responseBody.

              Authorization-related types must be used in at least one operation's
              requestBody or responseBody. Make sure to use the type appropriately
              in your API design.
 
              Existing authorization-related types used in operations are:
              - ${Array.from(candidates)
                .map((s) => `#/components/schemas/${s}`)
                .join("\n- ")}
            `,
          });
      },
    });
  };

  const validateDatabaseSchema = (props: IProps): void => {
    // fulfill error messages for "x-autobe-database-schema" misplacement
    for (const e of props.errors) {
      if (e.path.endsWith(`.properties["x-autobe-database-schema"]`) === false)
        continue;
      e.expected =
        "undefined value (remove this property and re-define it in the root schema)";
      e.description = StringUtil.trim`
        You have defined a property named "x-autobe-database-schema"
        somewhere wrong place.
        
        You have defined a property name "x-autobe-database-schema" as 
        an object type. However, this "x-autobe-database-schema" property
        must be defined only in the root schema object as a metadata,
        not in the nested object property.

        Remove this property at the next time, and re-define it in the
        root object schema.
        
        - Current path (wrong): ${e.path}
        - Must be (object root): ${e.path.replace(
          `.properties["x-autobe-database-schema"]`,
          `["x-autobe-database-schema"]`,
        )}
      `;
    }
    // check database schema existence
    AutoBeOpenApiTypeChecker.skim({
      schema: props.schema,
      accessor: `${props.path}[${JSON.stringify(props.typeName)}]`,
      closure: (schema, accessor) => {
        if (AutoBeOpenApiTypeChecker.isObject(schema) === false) return;
        else if (
          schema["x-autobe-database-schema"] !== null &&
          schema["x-autobe-database-schema"] !== undefined &&
          props.databaseSchemas.has(schema["x-autobe-database-schema"]) ===
            false
        )
          props.errors.push({
            path: `${accessor}["x-autobe-database-schema"]`,
            expected: Array.from(props.databaseSchemas)
              .map((s) => JSON.stringify(s))
              .join(" | "),
            value: schema["x-autobe-database-schema"],
            description: StringUtil.trim`
              You've referenced a non-existing database schema name
              ${JSON.stringify(schema["x-autobe-database-schema"])} in
              "x-autobe-database-schema" property. Make sure that the
              referenced database schema name exists in your database schema files.

              Never assume non-existing models. This is not recommendation,
              but an instruction you must follow. Never repeat the same
              value again. I repeat that, you have to choose one of below:

              Existing database schema names are:
              - ${Array.from(props.databaseSchemas).join("\n- ")}
            `,
          });
      },
    });
  };

  const validateRecursive = (props: IProps): void => {
    const report = (description: string) =>
      props.errors.push({
        path: props.path,
        expected: "Non-infinite recursive schema definition",
        value: props.schema,
        description,
      });
    if (
      AutoBeOpenApiTypeChecker.isReference(props.schema) &&
      props.schema.$ref === `#/components/schemas/${props.typeName}`
    )
      report(StringUtil.trim`
        You have defined a nonsensible type like below:

        \`\`\`typescript
        type ${props.typeName} = ${props.typeName};
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
      AutoBeOpenApiTypeChecker.isArray(props.schema) &&
      AutoBeOpenApiTypeChecker.isReference(props.schema.items) &&
      props.schema.items.$ref === `#/components/schemas/${props.typeName}`
    )
      report(StringUtil.trim`
        You have defined a nonsensible type like below:

        \`\`\`typescript
        type ${props.typeName} = Array<${props.typeName}>;
        \`\`\`

        This is an infinite recursive array type that cannot exist in any
        programming language. An array of itself creates a circular definition
        with no base case, making the type impossible to instantiate or validate.

        If you need nested structures, define explicit depth levels with separate
        types, or use parent-child relationships with ID references.
        Remove the self-reference and redesign the schema at the next time.
      `);
    else if (
      AutoBeOpenApiTypeChecker.isOneOf(props.schema) &&
      props.schema.oneOf.some(
        (v) =>
          AutoBeOpenApiTypeChecker.isReference(v) &&
          v.$ref === `#/components/schemas/${props.typeName}`,
      ) === true
    )
      report(StringUtil.trim`
        You have defined a nonsensible type like below:

        \`\`\`typescript
        type ${props.typeName} = ${props.typeName} | ...;
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
      AutoBeOpenApiTypeChecker.isObject(props.schema) &&
      props.schema.properties &&
      props.schema.required &&
      Object.entries(props.schema.properties).some(
        ([k, v]) =>
          AutoBeOpenApiTypeChecker.isReference(v) &&
          v.$ref === `#/components/schemas/${props.typeName}` &&
          (props.schema as AutoBeOpenApi.IJsonSchema.IObject).required.includes(
            k,
          ),
      )
    )
      report(StringUtil.trim`
        You have defined a nonsensible type like below:

        \`\`\`typescript
        interface ${props.typeName} {
          someProperty: ${props.typeName}; // required, non-nullable
        }
        \`\`\`

        This is an infinite recursive object type that cannot exist in any
        programming language. A required non-nullable property referencing its
        own type creates a circular definition with no base case, making the
        type impossible to instantiate.

        To create an instance of ${props.typeName}, you would need an instance of ${props.typeName},
        which requires another instance of ${props.typeName}, infinitely. This is logically
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

  const validateReferenceId = (props: {
    errors: IValidation.IError[];
    schema: AutoBeOpenApi.IJsonSchemaDescriptive;
    path: string;
  }): void => {
    if (AutoBeOpenApiTypeChecker.isObject(props.schema) === false) return;
    for (const [key, value] of Object.entries(props.schema.properties)) {
      if (key !== "id" && key.endsWith("_id") === false) continue;

      const accessor: string = `${props.path}.properties${
        Escaper.variable(key) ? `.${key}` : `[${JSON.stringify(key)}]`
      }`;
      const inspect = (schema: AutoBeOpenApi.IJsonSchema): boolean =>
        (AutoBeOpenApiTypeChecker.isString(schema) &&
          schema.format === "uuid") ||
        AutoBeOpenApiTypeChecker.isNull(schema) ||
        (AutoBeOpenApiTypeChecker.isOneOf(schema) &&
          schema.oneOf.every((v) => inspect(v)));
      if (inspect(value) === false)
        props.errors.push({
          path: accessor,
          expected: StringUtil.trim`
            | { type: "string"; format: "uuid"; description: string; } 
            | {
                oneOf: [
                  { type: "string"; format: "uuid"; },
                  { type: "null"; },
                ];
                description: string;
              }`,
          value,
          description: StringUtil.trim`
            Property names "id" or ending with "_id" must be defined as 
            UUID string type, or nullable UUID string type.

            This is the rule enforced to ensure consistent identification of 
            resources across the API. Even though you think that defining a 
            different type is more convenient for your specific use case,
            just follow the rule without any resistance.

            Note that, this is not a recommendation, but an instruction you 
            must follow.
          `,
        });
    }
  };

  const validatePropertyNames = (props: {
    errors: IValidation.IError[];
    schema: AutoBeOpenApi.IJsonSchemaDescriptive;
    path: string;
  }): void => {
    if (AutoBeOpenApiTypeChecker.isObject(props.schema) === false) return;
    for (const key of Object.keys(props.schema.properties)) {
      if (Escaper.reserved(key))
        props.errors.push({
          path: `${props.path}.properties${Escaper.variable(key) ? `.${key}` : `[${JSON.stringify(key)}]`}`,
          expected: `none system reserved word`,
          value: key,
          description: StringUtil.trim`
            Property name ${JSON.stringify(key)} is a system reserved word.

            Avoid using system reserved words as property names to prevent
            potential conflicts and ensure clarity in your API design.

            Change the property name ${JSON.stringify(key)} to a non-reserved
            word at the next time.

            Note that, this is not a recommendation, but an instruction you
            must follow.
          `,
        });
      else if (Escaper.variable(key) === false)
        props.errors.push({
          path: `${props.path}.properties${Escaper.variable(key) ? `.${key}` : `[${JSON.stringify(key)}]`}`,
          expected: `valid variable name`,
          value: key,
          description: StringUtil.trim`
            Property name ${JSON.stringify(key)} must be a valid variable name.

            Valid variable names start with a letter, underscore (_), or dollar sign ($),
            followed by letters, digits, underscores, or dollar signs. They cannot
            contain spaces or special characters.

            Change the property name ${JSON.stringify(key)} to a valid variable
            name at the next time.

            Note that, this is not a recommendation, but an instruction you
            must follow.
          `,
        });
    }
  };
}
