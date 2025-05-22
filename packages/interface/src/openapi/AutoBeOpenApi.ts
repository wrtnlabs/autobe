/**
 * OpenAPI Generative TypeScript Interface
 *
 * `AutoBeOpenApi` is a TypeScript interface for the OpenAPI Generative.
 *
 * `AutoBeOpenApi` follows the OpenAPI v3.1 specification, but is streamlined to
 * remove ambiguous and duplicated expressions for improved clarity, AI
 * generation capabilities, and developer understanding.
 *
 * @author Samchon
 */
export namespace AutoBeOpenApi {
  /* -----------------------------------------------------------
    DOCUMENT
  ----------------------------------------------------------- */
  /**
   * Document of the Restful API operations.
   *
   * This interface serves as the root document for defining Restful API
   * {@link operations} and {@link components}. It corresponds to the top-level
   * structure of an OpenAPI specification document, containing all API
   * operations and reusable components.
   *
   * This simplified version focuses only on the operations and components,
   * omitting other OpenAPI elements like info, servers, security schemes, etc.
   * to keep the structure concise for AI-based code generation.
   *
   * IMPORTANT: When creating this document, you MUST ensure that:
   *
   * 1. The API operations and component schemas directly correspond to the Prisma
   *    DB schema
   * 2. All entity types and their properties reference and incorporate the
   *    description comments from the related Prisma DB schema tables and
   *    columns
   * 3. Descriptions are detailed and organized into multiple paragraphs
   * 4. The API fully represents all entities and relationships defined in the
   *    Prisma schema
   * 5. EVERY SINGLE TABLE in the Prisma DB schema MUST have corresponding API
   *    operations for CRUD actions (Create, Read, Update, Delete) as
   *    applicable
   * 6. NO TABLE should be omitted from the API design - all tables require API
   *    coverage
   *
   * ## Type Naming Conventions
   *
   * When defining component schemas, follow these naming conventions for
   * consistency:
   *
   * - **Main Entity Types**: Use `IEntityName` format for main entity with
   *   detailed information (e.g., `IShoppingSale`)
   *
   *   - These MUST directly correspond to entity tables in the Prisma schema
   *   - Their descriptions MUST incorporate the table description comments from the
   *       Prisma schema
   *   - Each property MUST reference the corresponding column description from the
   *       Prisma schema
   *   - Entity types should represent the full, detailed version of domain entities
   * - **Related Operation Types**: Use `IEntityName.IOperation` format with these
   *   common suffixes:
   *
   *   - `IEntityName.ICreate`: Request body for creation operations (POST)
   *
   *       - Should include all required fields from the Prisma schema entity
   *   - `IEntityName.IUpdate`: Request body for update operations (PUT)
   *
   *       - Should include updatable fields as defined in the Prisma schema
   *   - `IEntityName.ISummary`: Simplified response version with essential
   *       properties
   *   - `IEntityName.IRequest`: Request parameters for list operations (often with
   *       search/pagination)
   *   - `IEntityName.IInvert`: Alternative view of an entity from a different
   *       perspective
   *   - `IPageIEntityName`: Paginated results container with `pagination` and
   *       `data` properties
   *
   * These consistent naming patterns create a predictable and self-documenting
   * API that accurately reflects the underlying Prisma schema, making it easier
   * for developers to understand the purpose of each schema and its
   * relationship to the database model.
   */
  export interface IDocument {
    /**
     * List of API operations.
     *
     * This array contains all the API endpoints with their HTTP methods,
     * descriptions, parameters, request/response structures, etc. Each
     * operation corresponds to an entry in the paths section of an OpenAPI
     * document.
     *
     * CRITICAL: This array MUST include operations for EVERY TABLE defined in
     * the Prisma schema. The AI generation MUST NOT skip or omit any tables
     * when creating operations. The operations array MUST be complete and
     * exhaustive, covering all database entities without exception.
     *
     * IMPORTANT: For each API operation, ensure that:
     *
     * 1. EVERY independent entity table in the Prisma schema has corresponding API
     *    operations for basic CRUD functions (at minimum)
     * 2. ALL TABLES from the Prisma schema MUST have at least one API operation,
     *    no matter how many tables are in the schema
     * 3. DO NOT STOP generating API operations until ALL tables have been
     *    addressed
     * 4. The description field refers to and incorporates the description comments
     *    from the related DB schema tables and columns
     * 5. The description must be VERY detailed and organized into MULTIPLE
     *    PARAGRAPHS separated by line breaks, not just a single paragraph
     * 6. The description should explain the purpose, functionality, and any
     *    relationships to other entities in the database schema
     *
     * Note that, combination of {@link AutoBeOpenApi.IOperation.path} and
     * {@link AutoBeOpenApi.IOperation.method} must be unique.
     *
     * Also, never forget any specification that is listed on the requirement
     * analysis report and DB design documents. Every feature must be
     * implemented in the API operations.
     *
     * @minItems 1
     */
    operations: AutoBeOpenApi.IOperation[];

    /**
     * Reusable components of the API operations.
     *
     * This contains schemas, parameters, responses, and other reusable elements
     * referenced throughout the API operations. It corresponds to the
     * components section in an OpenAPI document.
     *
     * CRITICAL: Components MUST include type definitions for EVERY TABLE in the
     * Prisma schema. The AI generation process MUST create schema components
     * for ALL database entities without exception, regardless of how many
     * tables are in the database.
     *
     * IMPORTANT: For all component types and their properties:
     *
     * 1. EVERY component MUST have a detailed description that references the
     *    corresponding Prisma DB schema table's description comments
     * 2. EACH property within component types MUST have detailed descriptions that
     *    reference the corresponding column description comments in the Prisma
     *    DB schema
     * 3. All descriptions MUST be organized into MULTIPLE PARAGRAPHS (separated by
     *    line breaks) based on different aspects of the entity
     * 4. Descriptions should be comprehensive enough that anyone who reads them
     *    can understand the purpose, functionality, and relationships of the
     *    type
     * 5. ALL TABLES from the Prisma schema MUST have corresponding schema
     *    components, no matter how many tables are in the schema
     *
     * All request and response bodies must reference named types defined in
     * this components section. This ensures consistency and reusability across
     * the API.
     *
     * ## Type Naming Conventions in Components
     *
     * When defining schema components, follow these standardized naming
     * patterns for consistency and clarity:
     *
     * ### Main Entity Types
     *
     * - `IEntityName`
     *
     *   - Primary entity objects (e.g., `IShoppingSale`, `IShoppingOrder`)
     *   - These represent the full, detailed version of domain entities
     *
     * ### Operation-Specific Types
     *
     * - `IEntityName.ICreate`
     *
     *   - Request body schemas for creation operations (POST)
     *   - Contains all fields needed to create a new entity
     * - `IEntityName.IUpdate`
     *
     *   - Request body schemas for update operations (PUT)
     *   - Contains fields that can be modified on an existing entity
     * - `IEntityName.IRequest`
     *
     *   - Parameters for search/filter/pagination in list operations
     *   - Often contains `search`, `sort`, `page`, and `limit` properties
     *
     * ### View Types
     *
     * - `IEntityName.ISummary`
     *
     *   - Simplified view of entities for list operations
     *   - Contains essential properties only, omitting detailed nested objects
     * - `IEntityName.IAbridge`: Intermediate view with more details than Summary
     *   but less than full entity
     * - `IEntityName.IInvert`: Alternative representation of an entity from a
     *   different perspective
     *
     * ### Container Types
     *
     * - `IPageIEntityName`
     *
     *   - Paginated results container
     *   - Usually contains `pagination` and `data` properties
     *
     * These naming conventions create a self-documenting API where the purpose
     * of each schema is immediately clear from its name. This helps both
     * developers and AI tools understand and maintain the API structure.
     */
    components: AutoBeOpenApi.IComponents;
  }

  /**
   * Operation of the Restful API.
   *
   * This interface defines a single API endpoint with its HTTP {@link method},
   * {@link path}, {@link parameters path parameters},
   * {@link requestBody request body}, and {@link responseBody} structure. It
   * corresponds to an individual operation in the paths section of an OpenAPI
   * document.
   *
   * Each operation requires a detailed explanation of its purpose through the
   * reason and description fields, making it clear why the API was designed and
   * how it should be used.
   *
   * All request bodies and responses for this operation must be object types
   * and must reference named types defined in the components section. The
   * content-type is always `application/json`. For file upload/download
   * operations, use `string & tags.Format<"uri">` in the appropriate schema
   * instead of binary data formats.
   *
   * In OpenAPI, this might represent:
   *
   * ```json
   * {
   *   "/shoppings/customers/orders": {
   *     "post": {
   *       "description": "Create a new order application from shopping cart...",
   *       "parameters": [...],
   *       "requestBody": {...},
   *       "responses": {...}
   *     }
   *   }
   * }
   * ```
   */
  export interface IOperation extends IEndpoint {
    /**
     * Specification of the API operation.
     *
     * Before defining the API operation interface, please describe what you're
     * planning to write in this `specification` field.
     *
     * The specification must be fully detailed and clear, so that anyone can
     * understand the purpose and functionality of the API operation and its
     * related components (e.g., {@link path}, {@link parameters},
     * {@link requestBody}).
     *
     * IMPORTANT: The specification MUST identify which Prisma DB table this
     * operation is associated with, helping ensure complete coverage of all
     * database entities.
     */
    specification: string;

    /**
     * Detailed description about the API operation.
     *
     * IMPORTANT: This field MUST be extensively detailed and MUST reference the
     * description comments from the related Prisma DB schema tables and
     * columns. The description should be organized into MULTIPLE PARAGRAPHS
     * separated by line breaks to improve readability and comprehension.
     *
     * For example, include separate paragraphs for:
     *
     * - The purpose and overview of the API operation
     * - Security considerations and user permissions
     * - Relationship to underlying database entities
     * - Validation rules and business logic
     * - Related API operations that might be used together with this one
     * - Expected behavior and error handling
     *
     * When writing the description, be sure to incorporate the corresponding DB
     * schema's description comments, matching the level of detail and style of
     * those comments. This ensures consistency between the API documentation
     * and database structure.
     *
     * If there's a dependency to other APIs, please describe the dependency API
     * operation in this field with detailed reason. For example, if this API
     * operation needs a pre-execution of other API operation, it must be
     * explicitly described.
     *
     * - `GET /shoppings/customers/sales` must be pre-executed to get entire list
     *   of summarized sales. Detailed sale information would be obtained by
     *   specifying the sale ID in the path parameter.
     *
     * > MUST be written in English. Never use other languages.
     */
    description: string;

    /**
     * Short summary of the API operation.
     *
     * This should be a concise description of the API operation, typically one
     * sentence long. It should provide a quick overview of what the API does
     * without going into too much detail.
     *
     * This summary will be used in the OpenAPI documentation to give users a
     * quick understanding of the API operation's purpose.
     *
     * IMPORTANT: The summary should clearly indicate which Prisma DB table this
     * operation relates to, helping to ensure all tables have API coverage.
     *
     * > MUST be written in English. Never use other languages
     */
    summary: string;

    /**
     * List of path parameters.
     *
     * Note that, the {@link AutoBeOpenApi.IParameter.name identifier name} of
     * path parameter must be corresponded to the
     * {@link path API operation path}.
     *
     * For example, if there's an API operation which has {@link path} of
     * `/shoppings/customers/sales/{saleId}/questions/${questionId}/comments/${commentId}`,
     * its list of {@link AutoBeOpenApi.IParameter.name path parameters} must be
     * like:
     *
     * - `saleId`
     * - `questionId`
     * - `commentId`
     */
    parameters: AutoBeOpenApi.IParameter[];

    /**
     * Request body of the API operation.
     *
     * Defines the payload structure for the request. Contains a description and
     * schema reference to define the expected input data.
     *
     * Should be `null` for operations that don't require a request body, such
     * as most "get" operations.
     */
    requestBody: AutoBeOpenApi.IRequestBody | null;

    /**
     * Response body of the API operation.
     *
     * Defines the structure of the successful response data. Contains a
     * description and schema reference for the returned data.
     *
     * Should be null for operations that don't return any data.
     */
    responseBody: AutoBeOpenApi.IResponseBody | null;
  }

  /**
   * Path parameter information for API routes.
   *
   * This interface defines a path parameter that appears in the URL of an API
   * endpoint. Path parameters are enclosed in curly braces in the
   * {@link AutoBeOpenApi.IOperation.path operation path} and must be defined
   * with their types and descriptions.
   *
   * For example, if API operation path is
   * `/shoppings/customers/sales/{saleId}/questions/${questionId}/comments/${commentId}`,
   * the path parameters should be like below:
   *
   * ```json
   * {
   *   "path": "/shoppings/customers/sales/{saleId}/questions/${questionId}/comments/${commentId}",
   *   "method": "get",
   *   "parameters": [
   *     {
   *       "name": "saleId",
   *       "in": "path",
   *       "schema": { "type": "string", "format": "uuid" },
   *       "description": "Target sale's ID"
   *     },
   *     {
   *       "name": "questionId",
   *       "in": "path",
   *       "schema": { "type": "string", "format": "uuid" },
   *       "description": "Target question's ID"
   *     },
   *     {
   *       "name": "commentId",
   *       "in": "path",
   *       "schema": { "type": "string", "format": "uuid" },
   *       "description": "Target comment's ID"
   *     }
   *   ]
   * }
   * ```
   */
  export interface IParameter {
    /**
     * Identifier name of the path parameter.
     *
     * This name must match exactly with the parameter name in the route path.
     * It must be corresponded to the
     * {@link AutoBeOpenApi.IOperation.path API operation path}.
     */
    name: string;

    /**
     * Description about the path parameter.
     *
     * Make short, concise and clear description about the path parameter.
     *
     * > MUST be written in English. Never use other languages.
     */
    description: string;

    /**
     * Type schema of the path parameter.
     *
     * Path parameters are typically primitive types like
     * {@link AutoBeOpenApi.IJsonSchema.IString strings},
     * {@link AutoBeOpenApi.IJsonSchema.IInteger integers},
     * {@link AutoBeOpenApi.IJsonSchema.INumber numbers}.
     *
     * If you need other types, please use request body instead with object type
     * encapsulation.
     */
    schema:
      | AutoBeOpenApi.IJsonSchema.IInteger
      | AutoBeOpenApi.IJsonSchema.INumber
      | AutoBeOpenApi.IJsonSchema.IString;
  }

  /**
   * Request body information of OpenAPI operation.
   *
   * This interface defines the structure for request bodies in API routes. It
   * corresponds to the requestBody section in OpenAPI specifications, providing
   * both a description and schema reference for the request payload.
   *
   * The content-type for all request bodies is always `application/json`. Even
   * when file uploading is required, don't use `multipart/form-data` or
   * `application/x-www-form-urlencoded` content types. Instead, just define an
   * URI string property in the request body schema.
   *
   * Note that, all body schemas must be transformable to a
   * {@link AutoBeOpenApi.IJsonSchema.IReference reference} type defined in the
   * {@link AutoBeOpenApi.IComponents.schemas components section} as an
   * {@link AutoBeOpenApi.IJsonSchema.IObject object} type.
   *
   * In OpenAPI, this might represent:
   *
   * ```json
   * {
   *   "requestBody": {
   *     "description": "Creation info of the order",
   *     "content": {
   *       "application/json": {
   *         "schema": {
   *           "$ref": "#/components/schemas/IShoppingOrder.ICreate"
   *         }
   *       }
   *     }
   *   }
   * }
   * ```
   */
  export interface IRequestBody {
    /**
     * Description about the request body.
     *
     * Make short, concise and clear description about the request body.
     *
     * > MUST be written in English. Never use other languages.
     */
    description: string;

    /**
     * Request body type name.
     *
     * This specifies the data structure expected in the request body, that will
     * be transformed to {@link AutoBeOpenApi.IJsonSchema.IReference reference}
     * type in the {@link AutoBeOpenApi.IComponents.schemas components section}
     * as an {@link AutoBeOpenApi.IJsonSchema.Object object} type.
     *
     * Here is the naming convention for the request body type:
     *
     * - `IEntityName.ICreate`: Request body for creation operations (POST)
     * - `IEntityName.IUpdate`: Request body for update operations (PUT)
     * - `IEntityName.IRequest`: Request parameters for list operations (often
     *   with search/pagination)
     *
     * What you write:
     *
     * ```json
     * {
     *   "typeName": "IShoppingOrder.ICreate"
     * }
     * ```
     *
     * Transformed to:
     *
     * ```json
     * {
     *   "schema": {
     *     "$ref": "#/components/schemas/IShoppingOrder.ICreate"
     *   }
     * }
     * ```
     */
    typeName: string;
  }

  /**
   * Response body information for OpenAPI operation.
   *
   * This interface defines the structure of a successful response from an API
   * operation. It provides a description of the response and a schema reference
   * to define the returned data structure.
   *
   * The content-type for all responses is always `application/json`. Even when
   * file downloading is required, don't use `application/octet-stream` or
   * `multipart/form-data` content types. Instead, just define an URI string
   * property in the response body schema.
   *
   * In OpenAPI, this might represent:
   *
   * ```json
   * {
   *   "responses": {
   *     "200": {
   *       "description": "Order information",
   *       "content": {
   *         "application/json": {
   *           "schema": { "$ref": "#/components/schemas/IShoppingOrder" }
   *         }
   *       }
   *     }
   *   }
   * }
   * ```
   */
  export interface IResponseBody {
    /**
     * Description about the response body.
     *
     * Make short, concise and clear description about the response body.
     *
     * > MUST be written in English. Never use other languages.
     */
    description: string;

    /**
     * Response body's data type.
     *
     * Specifies the structure of the returned data (response body), that will
     * be transformed to {@link AutoBeOpenApi.IJsonSchema.IReference} type in the
     * {@link AutoBeOpenApi.IComponents.schemas components section} as an
     * {@link AutoBeOpenApi.IJsonSchema.IObject object} type.
     *
     * Here is the naming convention for the response body type:
     *
     * - `IEntityName`: Main entity with detailed information (e.g.,
     *   `IShoppingSale`)
     * - `IEntityName.ISummary`: Simplified response version with essential
     *   properties
     * - `IEntityName.IInvert`: Alternative view of an entity from a different
     *   perspective
     * - `IPageIEntityName`: Paginated results container with `pagination` and
     *   `data` properties
     *
     * What you write:
     *
     * ```json
     * {
     *   "typeName": "IShoppingOrder"
     * }
     * ```
     *
     * Transformed to:
     *
     * ```json
     * {
     *   "schema": {
     *     "$ref": "#/components/schemas/IShoppingOrder"
     *   }
     * }
     * ```
     */
    typeName: string;
  }

  /* -----------------------------------------------------------
    JSON SCHEMA
  ----------------------------------------------------------- */
  /**
   * Reusable components in OpenAPI.
   *
   * A storage of reusable components in OpenAPI document.
   *
   * In other words, it is a storage of named DTO schemas and security schemes.
   */
  export interface IComponents {
    /**
     * An object to hold reusable DTO schemas.
     *
     * In other words, a collection of named JSON schemas.
     *
     * IMPORTANT: For each schema in this collection:
     *
     * 1. EVERY schema MUST have a detailed description that references and aligns
     *    with the description comments from the corresponding Prisma DB schema
     *    tables
     * 2. EACH property within the schema MUST have detailed descriptions that
     *    reference and align with the description comments from the
     *    corresponding DB schema columns
     * 3. All descriptions MUST be organized into MULTIPLE PARAGRAPHS (separated by
     *    line breaks) when appropriate
     * 4. Descriptions should be comprehensive enough that anyone reading them can
     *    understand the purpose, functionality, and constraints of each type
     *    and property without needing to reference other documentation
     */
    schemas: Record<string, IJsonSchemaDescriptive>;

    /** Whether includes `Authorization` header or not. */
    authorization?: "header" | undefined;
  }

  /**
   * Type schema info.
   *
   * `AutoBeOpenApi.IJsonSchema` is a type schema info of the OpenAPI
   * Generative.
   *
   * `AutoBeOpenApi.IJsonSchema` basically follows the JSON schema specification
   * of OpenAPI v3.1, but a little bit shrunk to remove ambiguous and duplicated
   * expressions of OpenAPI v3.1 for the convenience, clarity, and AI
   * generation.
   */
  export type IJsonSchema =
    | IJsonSchema.IConstant
    | IJsonSchema.IBoolean
    | IJsonSchema.IInteger
    | IJsonSchema.INumber
    | IJsonSchema.IString
    | IJsonSchema.IArray
    | IJsonSchema.IObject
    | IJsonSchema.IReference;
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
      /**
       * Minimum value restriction.
       *
       * @type int64
       */
      minimum?: number;

      /**
       * Maximum value restriction.
       *
       * @type int64
       */
      maximum?: number;

      /** Exclusive minimum value restriction. */
      exclusiveMinimum?: number;

      /** Exclusive maximum value restriction. */
      exclusiveMaximum?: number;

      /**
       * Multiple of value restriction.
       *
       * @type uint64
       * @exclusiveMinimum 0
       */
      multipleOf?: number;
    }

    /** Number (double) type info. */
    export interface INumber extends ISignificant<"number"> {
      /** Minimum value restriction. */
      minimum?: number;

      /** Maximum value restriction. */
      maximum?: number;

      /** Exclusive minimum value restriction. */
      exclusiveMinimum?: number;

      /** Exclusive maximum value restriction. */
      exclusiveMaximum?: number;

      /**
       * Multiple of value restriction.
       *
       * @exclusiveMinimum 0
       */
      multipleOf?: number;
    }

    /** String type info. */
    export interface IString extends ISignificant<"string"> {
      /** Format restriction. */
      format?:
        | "binary"
        | "byte"
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
        | "relative-json-pointer"
        | (string & {});

      /** Pattern restriction. */
      pattern?: string;

      /** Content media type restriction. */
      contentMediaType?: string;

      /**
       * Minimum length restriction.
       *
       * @type uint64
       */
      minLength?: number;

      /**
       * Maximum length restriction.
       *
       * @type uint64
       */
      maxLength?: number;
    }

    /** Array type info. */
    export interface IArray extends ISignificant<"array"> {
      /**
       * Items type info.
       *
       * The `items` means the type of the array elements. In other words, it is
       * the type schema info of the `T` in the TypeScript array type
       * `Array<T>`.
       */
      items: IJsonSchema;

      /**
       * Unique items restriction.
       *
       * If this property value is `true`, target array must have unique items.
       */
      uniqueItems?: boolean;

      /**
       * Minimum items restriction.
       *
       * Restriction of minimum number of items in the array.
       *
       * @type uint64
       */
      minItems?: number;

      /**
       * Maximum items restriction.
       *
       * Restriction of maximum number of items in the array.
       *
       * @type uint64
       */
      maxItems?: number;
    }

    /** Object type info. */
    export interface IObject extends ISignificant<"object"> {
      /**
       * Properties of the object.
       *
       * The `properties` means a list of key-value pairs of the object's
       * regular properties. The key is the name of the regular property, and
       * the value is the type schema info.
       *
       * IMPORTANT: Each property in this object MUST have a detailed
       * description that references and aligns with the description comments
       * from the corresponding Prisma DB schema column.
       *
       * If you need additional properties that is represented by dynamic key,
       * you can use the {@link additionalProperties} instead.
       */
      properties: Record<string, IJsonSchemaDescriptive>;

      /**
       * Additional properties' info.
       *
       * The `additionalProperties` means the type schema info of the additional
       * properties that are not listed in the {@link properties}.
       *
       * If the value is `false`, it means that the additional properties are
       * not specified. Otherwise, if the value is {@link IJsonSchema} type, it
       * means that the additional properties must follow the type schema info.
       *
       * - `false`: No additional properties
       * - `IJsonSchema`: `Record<string, T>`
       */
      additionalProperties?: false | IJsonSchema;

      /**
       * List of key values of the required properties.
       *
       * The `required` means a list of the key values of the required
       * {@link properties}. If some property key is not listed in the `required`
       * list, it means that property is optional. Otherwise some property key
       * exists in the `required` list, it means that the property must be
       * filled.
       *
       * Below is an example of the {@link properties} and `required`.
       *
       * ```typescript
       * interface SomeObject {
       *   id: string;
       *   email: string;
       *   name?: string;
       * }
       * ```
       *
       * As you can see, `id` and `email` {@link properties} are {@link required},
       * so that they are listed in the `required` list.
       *
       * ```json
       * {
       *   "type": "object",
       *   "properties": {
       *     "id": { "type": "string" },
       *     "email": { "type": "string" },
       *     "name": { "type": "string" }
       *   },
       *   "required": ["id", "email"]
       * }
       * ```
       */
      required: string[];
    }

    /** Reference type directing named schema. */
    export interface IReference {
      /**
       * Reference to the named schema.
       *
       * The `ref` is a reference to the named schema. Format of the `$ref` is
       * following the JSON Pointer specification. In the OpenAPI, the `$ref`
       * starts with `#/components/schemas/` which means the type is stored in
       * the {@link AutoBeOpenApi.IComponents.schemas} object.
       *
       * - `#/components/schemas/SomeObject`
       * - `#/components/schemas/AnotherObject`
       */
      $ref: string;
    }

    /**
     * Union type.
     *
     * `IOneOf` represents an union type of the TypeScript (`A | B | C`).
     *
     * For reference, even though your Swagger (or OpenAPI) document has defined
     * `anyOf` instead of the `oneOf`, {@link AutoBeOpenApi} forcibly converts it
     * to `oneOf` type.
     */
    export interface IOneOf {
      /** List of the union types. */
      oneOf: Exclude<IJsonSchema, IJsonSchema.IOneOf>[];

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
         * {@link IOneOf.oneof} elements. Therefore, `key` of `mapping` is the
         * discriminator value, and `value` of `mapping` is the schema name like
         * `#/components/schemas/SomeObject`.
         */
        mapping?: Record<string, string>;
      }
    }

    /** Null type. */
    export interface INull extends ISignificant<"null"> {}

    interface ISignificant<Type extends string> {
      /** Discriminator value of the type. */
      type: Type;
    }
  }

  /**
   * Descriptive type schema info.
   *
   * `AutoBeOpenApi.IJsonSchemaDescriptive` is a type schema info of the OpenAPI
   * Generative, but it has a `description` property which is required.
   *
   * `AutoBeOpenApi.IJsonSchemaDescriptive` basically follows the JSON schema
   * specification of OpenAPI v3.1, but a little bit shrunk to remove ambiguous
   * and duplicated expressions of OpenAPI v3.1 for the convenience, clarity,
   * and AI generation.
   *
   * CRITICAL INSTRUCTIONS FOR OPTIMAL AI GENERATION:
   *
   * When creating descriptions for components, types, and properties:
   *
   * 1. ALWAYS refer to and incorporate the description comments from the
   *    corresponding Prisma DB schema tables and columns. The descriptions
   *    should match the style, level of detail, and terminology used in the
   *    Prisma schema.
   * 2. ALL descriptions MUST be organized into MULTIPLE PARAGRAPHS separated by
   *    line breaks. Single-paragraph descriptions should be avoided.
   * 3. Descriptions should comprehensively cover:
   *
   *    - The purpose and business meaning of the type or property
   *    - Relationships to other entities
   *    - Validation rules, constraints, and edge cases
   *    - Usage context and examples when helpful
   * 4. For each property of an object type, ensure its description reflects the
   *    corresponding column description in the Prisma DB schema, maintaining
   *    the same level of detail and terminology
   * 5. Descriptions should be so detailed and clear that anyone reading them can
   *    fully understand the type or property without needing to reference any
   *    other documentation
   */
  export type IJsonSchemaDescriptive<Schema extends IJsonSchema = IJsonSchema> =
    Omit<Schema, "description"> & {
      /**
       * Description about the type.
       *
       * CRITICAL: This description MUST be extensively detailed and MUST
       * reference and align with the description comments from the
       * corresponding Prisma DB schema tables and columns.
       *
       * The description MUST be organized into MULTIPLE PARAGRAPHS (separated
       * by line breaks) based on different aspects of the type:
       *
       * - The purpose and business meaning of the type
       * - Relationships to other entities in the system
       * - Validation rules, constraints, and edge cases
       * - Usage context and examples when helpful
       *
       * This structured approach improves readability and helps readers better
       * understand the type's various characteristics and use cases. The
       * description should be so comprehensive that anyone reading it can fully
       * understand the type without needing to reference other documentation.
       *
       * > MUST be written in English. Never use other languages.
       */
      description: string;
    };

  /* -----------------------------------------------------------
    BACKGROUNDS
  ----------------------------------------------------------- */
  /** API endpoint information. */
  export interface IEndpoint {
    /**
     * HTTP path of the API operation.
     *
     * The URL path for accessing this API operation, using path parameters
     * enclosed in curly braces (e.g., `/shoppings/customers/sales/{saleId}`).
     *
     * It must be corresponded to the {@link parameters path parameters}.
     *
     * The path structure should clearly indicate which database entity this
     * operation is manipulating, helping to ensure all entities have
     * appropriate API coverage.
     */
    path: string;

    /**
     * HTTP method of the API operation.
     *
     * Note that, if the API operation has {@link requestBody}, method must not
     * be `get`.
     *
     * Also, even though the API operation has been designed to only get
     * information, but it needs complicated request information, it must be
     * defined as `patch` method with {@link requestBody} data specification.
     *
     * - `get`: get information
     * - `patch`: get information with complicated request data
     *   ({@link requestBody})
     * - `post`: create new record
     * - `put`: update existing record
     * - `delete`: remove record
     */
    method: "get" | "post" | "put" | "delete" | "patch";
  }
}
