import { tags } from "typia";

import { CamelCasePattern } from "../typings/CamelCasePattern";

/**
 * AST for OpenAPI v3.1 specification generation via AI function calling.
 *
 * Simplified from full OpenAPI to remove ambiguous/duplicated expressions while
 * maintaining type safety for AI-driven code generation.
 *
 * All description fields MUST be written in English. Never use other languages.
 */
export namespace AutoBeOpenApi {
  /* -----------------------------------------------------------
    DOCUMENT
  ----------------------------------------------------------- */
  /**
   * Root document for Restful API operations and components.
   *
   * Corresponds to the top-level OpenAPI structure, containing all API
   * operations and reusable component schemas.
   */
  export interface IDocument {
    /**
     * List of API operations.
     *
     * Combination of {@link AutoBeOpenApi.IOperation.path} and
     * {@link AutoBeOpenApi.IOperation.method} must be unique.
     *
     * @minItems 1
     */
    operations: AutoBeOpenApi.IOperation[];

    /**
     * Reusable components referenced by API operations.
     *
     * Type naming conventions for schemas:
     *
     * - `IEntityName`: Full detailed entity (e.g., `IShoppingSale`)
     * - `IEntityName.ICreate`: Request body for POST creation
     * - `IEntityName.IUpdate`: Request body for PUT update
     * - `IEntityName.IRequest`: Search/filter/pagination parameters
     * - `IEntityName.ISummary`: Simplified view for list operations
     * - `IEntityName.IAbridge`: Intermediate detail level
     * - `IEntityName.IInvert`: Alternative perspective of an entity
     * - `IPageIEntityName`: Paginated results with `pagination` and `data`
     */
    components: AutoBeOpenApi.IComponents;
  }

  /**
   * Single API endpoint with method, path, parameters, and request/response.
   *
   * All request/response bodies must be object types referencing named
   * components. Content-type is always `application/json`. For file
   * upload/download, use `string & tags.Format<"uri">` instead of binary.
   */
  export interface IOperation extends IEndpoint {
    /**
     * Internal implementation guidance for downstream agents (Realize, Test).
     *
     * Describe HOW this operation should be implemented: service logic, DB
     * queries, business rules, edge cases, and error handling.
     *
     * > MUST be written in English. Never use other languages.
     */
    specification: string;

    /**
     * API documentation for consumers. Describe the operation's purpose,
     * business logic, relationships, and error handling.
     *
     * Format: summary sentence first, `\n\n`, then paragraphs grouped by topic.
     * Reference DB schema table/column descriptions for consistency.
     *
     * Do NOT use "soft delete" / "soft-delete" unless the operation actually
     * implements soft deletion (triggers validation expecting
     * soft_delete_column).
     *
     * > MUST be written in English. Never use other languages.
     */
    description: string;

    /**
     * Authorization type of the API operation.
     *
     * - `"login"`: Credential validation operations
     * - `"join"`: Account registration operations
     * - `"refresh"`: Token renewal operations
     * - `null`: All other operations
     */
    authorizationType: "login" | "join" | "refresh" | null;

    /**
     * List of path parameters.
     *
     * Each parameter name must correspond to a `{paramName}` in the
     * {@link path}.
     */
    parameters: AutoBeOpenApi.IParameter[];

    /** Request body of the API operation, or `null` if none. */
    requestBody: AutoBeOpenApi.IRequestBody | null;

    /** Response body of the API operation, or `null` if none. */
    responseBody: AutoBeOpenApi.IResponseBody | null;

    /**
     * Authorization actor required to access this API operation.
     *
     * MUST use camelCase. The actor name MUST match exactly with a user
     * type/table defined in the database schema.
     *
     * Set to `null` for public endpoints requiring no authentication.
     */
    authorizationActor: (string & CamelCasePattern & tags.MinLength<1>) | null;

    /**
     * Functional name of the API endpoint. MUST use camelCase.
     *
     * MUST NOT be a JS/TS reserved word (`delete`, `for`, `if`, `class`,
     * `return`, `new`, `this`, `void`, `const`, `let`, `var`, `async`, `await`,
     * `export`, `import`, `switch`, `case`, `throw`, `try`). Use `erase`
     * instead of `delete`, `iterate` instead of `for`.
     *
     * Standard names:
     *
     * - `index`: list/search (PATCH), `at`: get by ID (GET)
     * - `create`: POST, `update`: PUT, `erase`: DELETE
     *
     * Accessor uniqueness: the accessor is formed by joining non-parameter path
     * segments with dots, then appending the name. E.g., path
     * `/shopping/sale/{saleId}/review/{reviewId}` + name `at` = accessor
     * `shopping.sale.review.at`. Must be globally unique.
     */
    name: string & CamelCasePattern;

    /**
     * Prerequisites: API operations that must succeed before this one.
     *
     * ONLY for business logic dependencies (resource existence, state checks,
     * data availability). NEVER for authentication -- use `authorizationActor`
     * instead.
     *
     * Prerequisites are executed in array order; all must return 2xx before the
     * main operation proceeds.
     *
     * @see {@link IPrerequisite}
     */
    prerequisites: IPrerequisite[];

    /**
     * Accessor of the operation.
     *
     * If you configure this property, the assigned value will be used as
     * {@link IHttpMigrateRoute.accessor}. Also, it can be used as the
     * {@link IHttpLlmFunction.name} by joining with `.` character in the LLM
     * function calling application.
     *
     * Note that the `x-samchon-accessor` value must be unique in the entire
     * OpenAPI document operations. If there are duplicated `x-samchon-accessor`
     * values, {@link IHttpMigrateRoute.accessor} will ignore all duplicated
     * `x-samchon-accessor` values and generate the
     * {@link IHttpMigrateRoute.accessor} by itself.
     *
     * @internal
     */
    accessor?: string[] | undefined;
  }

  /**
   * Authorization definition for an actor type.
   *
   * Uses `Authorization: Bearer <token>` header only. The token is guaranteed
   * to include the authenticated actor's `id` field.
   */
  export interface IAuthorization {
    /**
     * Actor name in camelCase. MUST exactly match a table name in the database
     * schema representing this user type.
     */
    name: string & CamelCasePattern;

    /**
     * Description of this authorization actor's purpose and capabilities.
     *
     * > MUST be written in English. Never use other languages.
     */
    description: string;
  }

  /** Path parameter definition for an API route. */
  export interface IParameter {
    /**
     * Description of the path parameter.
     *
     * > MUST be written in English. Never use other languages.
     */
    description: string;

    /**
     * Identifier name in camelCase. Must match the `{paramName}` in the
     * {@link AutoBeOpenApi.IOperation.path}.
     */
    name: string & CamelCasePattern;

    /** Type schema of the path parameter (primitive types only). */
    schema:
      | AutoBeOpenApi.IJsonSchema.IInteger
      | AutoBeOpenApi.IJsonSchema.INumber
      | AutoBeOpenApi.IJsonSchema.IString;
  }

  /**
   * Request body for an API operation.
   *
   * Content-type is always `application/json`. For file uploads, use a URI
   * string property instead of `multipart/form-data`.
   */
  export interface IRequestBody {
    /**
     * Description of the request body.
     *
     * > MUST be written in English. Never use other languages.
     */
    description: string;

    /**
     * Type name referencing a component schema.
     *
     * Naming convention: `IEntityName.ICreate` (POST), `IEntityName.IUpdate`
     * (PUT), `IEntityName.IRequest` (list/search).
     */
    typeName: string;
  }

  /**
   * Response body for an API operation.
   *
   * Content-type is always `application/json`. For file downloads, use a URI
   * string property instead of `application/octet-stream`.
   */
  export interface IResponseBody {
    /**
     * Description of the response body.
     *
     * > MUST be written in English. Never use other languages.
     */
    description: string;

    /**
     * Type name referencing a component schema.
     *
     * Naming convention: `IEntityName` (full), `IEntityName.ISummary`,
     * `IEntityName.IInvert`, `IPageIEntityName` (paginated).
     */
    typeName: string;
  }

  /* -----------------------------------------------------------
    JSON SCHEMA
  ----------------------------------------------------------- */
  /** Reusable named DTO schemas and security schemes. */
  export interface IComponents {
    /**
     * Named DTO schemas.
     *
     * Type naming conventions:
     *
     * - `IEntityName`: Full detailed entity
     * - `IEntityName.ICreate`: POST request body
     * - `IEntityName.IUpdate`: PUT request body
     * - `IEntityName.ISummary`: Simplified list view
     * - `IEntityName.IRequest`: Search/filter parameters
     * - `IEntityName.IInvert`: Alternative perspective
     * - `IPageIEntityName`: Paginated results (`pagination` + `data`)
     */
    schemas: Record<string, IJsonSchemaDescriptive>;

    /** Authorization schemes for authenticated actors. */
    authorizations: IAuthorization[];
  }

  /**
   * JSON Schema type following OpenAPI v3.1 (simplified).
   *
   * CRITICAL: Union types MUST use `IOneOf`. NEVER use array in `type` field.
   *
   * Wrong: `{ type: ["string", "null"] }` Correct: `{ oneOf: [{ type: "string"
   * }, { type: "null" }] }`
   *
   * The `type` field is a discriminator and MUST be a single string value.
   */
  export type IJsonSchema =
    | IJsonSchema.IConstant
    | IJsonSchema.IBoolean
    | IJsonSchema.IInteger
    | IJsonSchema.INumber
    | IJsonSchema.IString
    | IJsonSchema.IArray
    | IJsonSchema.IObject
    | IJsonSchema.IReference
    | IJsonSchema.IOneOf
    | IJsonSchema.INull;
  export namespace IJsonSchema {
    /** Constant value type. */
    export interface IConstant {
      /** The constant value. */
      const: boolean | number | string;
    }

    /** Boolean type info. */
    export interface IBoolean extends ISignificant<"boolean"> {}

    /** Integer type info. */
    export interface IInteger extends ISignificant<"integer"> {
      /** @type int64 */
      minimum?: number;

      /** @type int64 */
      maximum?: number;

      /** @type int64 */
      exclusiveMinimum?: number;

      /** @type int64 */
      exclusiveMaximum?: number;

      /**
       * @type uint64
       * @exclusiveMinimum 0
       */
      multipleOf?: number;
    }

    /** Number (double) type info. */
    export interface INumber extends ISignificant<"number"> {
      minimum?: number;

      maximum?: number;

      exclusiveMinimum?: number;

      exclusiveMaximum?: number;

      /** @exclusiveMinimum 0 */
      multipleOf?: number;
    }

    /** String type info. */
    export interface IString extends ISignificant<"string"> {
      /** Format restriction. */
      format?:
        | "password"
        | "regex"
        | "uuid"
        | "email"
        | "hostname"
        | "idn-email"
        | "idn-hostname"
        | "iri"
        | "iri-reference"
        | "ipv4"
        | "ipv6"
        | "uri"
        | "uri-reference"
        | "uri-template"
        | "url"
        | "date-time"
        | "date"
        | "time"
        | "duration"
        | "json-pointer"
        | "relative-json-pointer";

      /** Pattern restriction. */
      pattern?: string;

      /**
       * Content media type restriction.
       *
       * For multiple media types, use `oneOf` with separate string schemas per
       * `contentMediaType` value. Never use an array here.
       */
      contentMediaType?: string;

      /** @type uint64 */
      minLength?: number;

      /** @type uint64 */
      maxLength?: number;
    }

    /** Array type info. */
    export interface IArray extends ISignificant<"array"> {
      /** Type schema of array elements. */
      items: Exclude<IJsonSchema, IJsonSchema.IObject>;

      /** If `true`, array elements must be unique. */
      uniqueItems?: boolean;

      /** @type uint64 */
      minItems?: number;

      /** @type uint64 */
      maxItems?: number;
    }

    /** Object type info. */
    export interface IObject extends ISignificant<"object"> {
      /** @ignore */
      "x-autobe-database-schema"?: string | null | undefined;

      /** Key-value pairs of the object's named properties. */
      properties: Record<string, IJsonSchema>;

      /**
       * Schema for dynamic keys (`Record<string, T>`), or `false` if no
       * additional properties are allowed.
       */
      additionalProperties?: false | Exclude<IJsonSchema, IJsonSchema.IObject>;

      /**
       * Property keys that must be present. Properties not listed here are
       * optional.
       */
      required: string[];
    }

    /** Reference type directing named schema. */
    export interface IReference {
      /**
       * JSON Pointer reference to a named schema (e.g.,
       * `#/components/schemas/SomeObject`).
       */
      $ref: string;
    }

    /**
     * Union type.
     *
     * `IOneOf` represents a union type in TypeScript (`A | B | C`).
     *
     * For reference, even though your Swagger (or OpenAPI) document has defined
     * `anyOf` instead of the `oneOf`, {@link AutoBeOpenApi} forcibly converts it
     * to `oneOf` type.
     */
    export interface IOneOf {
      /** List of the union types. */
      oneOf: Exclude<IJsonSchema, IJsonSchema.IOneOf | IJsonSchema.IObject>[];

      /** Discriminator info of the union type. */
      discriminator?: IOneOf.IDiscriminator;
    }
    export namespace IOneOf {
      /** Discriminator info of the union type. */
      export interface IDiscriminator {
        /** Property name for the discriminator. */
        propertyName: string;

        /**
         * Mapping of the discriminator value to the schema name.
         *
         * This property is valid only for {@link IReference} typed
         * {@link IOneOf.oneOf} elements. Therefore, `key` of `mapping` is the
         * discriminator value, and `value` of `mapping` is the schema name like
         * `#/components/schemas/SomeObject`.
         */
        mapping?: Record<string, string>;
      }
    }

    /** Null type. */
    export interface INull extends ISignificant<"null"> {}

    interface ISignificant<Type extends string> {
      /**
       * Discriminator value. MUST be a single string, NEVER an array.
       *
       * For nullable types, use `IOneOf` instead: `{ oneOf: [{ type: "string"
       * }, { type: "null" }] }`
       */
      type: Type;
    }
  }

  /**
   * Descriptive type schema info with required documentation.
   *
   * `AutoBeOpenApi.IJsonSchemaDescriptive` extends the base JSON schema types
   * with a required `description` field for API documentation. For object
   * types, it also includes an `x-autobe-specification` field for
   * implementation guidance.
   *
   * @ignore
   */
  export type IJsonSchemaDescriptive =
    | IJsonSchemaDescriptive.IConstant
    | IJsonSchemaDescriptive.IBoolean
    | IJsonSchemaDescriptive.IInteger
    | IJsonSchemaDescriptive.INumber
    | IJsonSchemaDescriptive.IString
    | IJsonSchemaDescriptive.IArray
    | IJsonSchemaDescriptive.IObject
    | IJsonSchemaDescriptive.IReference
    | IJsonSchemaDescriptive.IOneOf
    | IJsonSchemaDescriptive.INull;
  export namespace IJsonSchemaDescriptive {
    export interface IConstant extends IDescriptive, IJsonSchema.IConstant {}
    export interface IBoolean extends IDescriptive, IJsonSchema.IBoolean {}
    export interface IInteger extends IDescriptive, IJsonSchema.IInteger {}
    export interface INumber extends IDescriptive, IJsonSchema.INumber {}
    export interface IString extends IDescriptive, IJsonSchema.IString {}
    export interface IArray extends IDescriptive, IJsonSchema.IArray {}
    export interface IObject extends IDescriptive, IJsonSchema.IObject {
      properties: Record<string, IJsonSchemaProperty>;
    }
    export interface IReference extends IDescriptive, IJsonSchema.IReference {}
    export interface IOneOf extends IDescriptive, IJsonSchema.IOneOf {}
    export interface INull extends IDescriptive, IJsonSchema.INull {}

    interface IDescriptive {
      "x-autobe-specification"?: string | undefined;
      description: string;
    }
  }

  /**
   * Type schema for object properties with implementation specifications.
   *
   * `IJsonSchemaProperty` extends the base JSON Schema types with
   * implementation specifications. Each property in an
   * {@link IJsonSchema.IObject object schema} uses this type.
   *
   * @ignore
   */
  export type IJsonSchemaProperty =
    | IJsonSchemaProperty.IConstant
    | IJsonSchemaProperty.IBoolean
    | IJsonSchemaProperty.IInteger
    | IJsonSchemaProperty.INumber
    | IJsonSchemaProperty.IString
    | IJsonSchemaProperty.IArray
    | IJsonSchemaProperty.IReference
    | IJsonSchemaProperty.IOneOf
    | IJsonSchemaProperty.INull;
  export namespace IJsonSchemaProperty {
    export interface IConstant extends IProperty, IJsonSchema.IConstant {}
    export interface IBoolean extends IProperty, IJsonSchema.IBoolean {}
    export interface IInteger extends IProperty, IJsonSchema.IInteger {}
    export interface INumber extends IProperty, IJsonSchema.INumber {}
    export interface IString extends IProperty, IJsonSchema.IString {}
    export interface IArray extends IProperty, IJsonSchema.IArray {}
    export interface IReference extends IProperty, IJsonSchema.IReference {}
    export interface IOneOf extends IProperty, IJsonSchema.IOneOf {}
    export interface INull extends IProperty, IJsonSchema.INull {}
    interface IProperty {
      "x-autobe-database-schema-property"?: string | null | undefined;
      "x-autobe-specification"?: string | undefined;
      description: string;
    }
  }

  /* -----------------------------------------------------------
    BACKGROUNDS
  ----------------------------------------------------------- */
  /** API endpoint information. */
  export interface IEndpoint {
    /**
     * HTTP path of the API operation.
     *
     * Must start with `/`. Parameters use curly braces: `{paramName}`. Resource
     * names in camelCase. No quotes, spaces, role prefixes (`/admin/`), or API
     * version prefixes (`/api/v1/`).
     *
     * Allowed characters: letters, digits, `/`, `{`, `}`, `-`, `_`, `.`
     */
    path: string & tags.Pattern<"^\\/[a-zA-Z0-9\\/_{}.-]*$">;

    /**
     * HTTP method (lowercase only).
     *
     * Use `patch` (not `get`) when a read operation needs a complex
     * {@link requestBody}. `get` cannot have a request body.
     */
    method: "get" | "post" | "put" | "delete" | "patch";
  }

  /**
   * Prerequisite API operation that must succeed before the main operation.
   *
   * ONLY for business logic dependencies (resource existence, state checks,
   * data availability). NEVER for authentication or authorization -- those are
   * handled via `authorizationActor`.
   *
   * Keep prerequisite chains minimal. Descriptions should explain WHY the
   * dependency is needed.
   */
  export interface IPrerequisite {
    /** The API endpoint that must be called first. */
    endpoint: IEndpoint;

    /**
     * Why this prerequisite is required (specific condition or state).
     *
     * > MUST be written in English. Never use other languages.
     */
    description: string;
  }
}
