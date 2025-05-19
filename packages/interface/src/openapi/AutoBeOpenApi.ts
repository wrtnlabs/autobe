/**
 * OpenAPI Generative TypeScript Interface
 *
 * `AutoBeOpenApi` is a TypeScript interface for the OpenAPI Generative.
 *
 * `AutoBeOpenApi` is basically follows the OpenAPI v3.1 specification,
 * but a little bit shrunk to remove ambiguous and duplicated expressions
 * of OpenAPI v3.1 for the convenience, clarity, and AI generation.
 *
 * @author Samchon
 */
export namespace AutoBeOpenApi {
  /**
   * Request body information of OpenAPI operation.
   *
   * This interface defines the structure for request bodies in API routes.
   * It corresponds to the requestBody section in OpenAPI specifications,
   * providing both a description and schema reference for the request payload.
   *
   * The content-type for all request bodies is always `application/json`.
   * Even when file uploading is required, don't use `multipart/form-data`
   * or `application/x-www-form-urlencoded` content types. Instead, just
   * define an URI string property in the request body schema.
   *
   * Note that, all body schemas must be transformable to a
   * {@link AutoBeOpenApi.IJsonSchema.IReference reference} type defined in
   * the {@link AutoBeOpenApi.IComponents.schemas components section} as
   * an {@link AutoBeOpenApi.IJsonSchema.IObject object} type.
   *
   * In OpenAPI, this might represent:
   *
   * ```json
   * {
   *   "requestBody": {
   *     "description": "Creation info of the order",
   *     "content": {
   *       "application/json": {
   *         "schema": { "$ref": "#/components/schemas/IShoppingOrder.ICreate" }
   *       }
   *     }
   *   }
   * }
   * ```
   */
  export interface IDocument {
    /**
     * List of API operations.
     *
     * This array contains all the API endpoints with their HTTP methods,
     * descriptions, parameters, request/response structures, etc.
     * Each operation corresponds to an entry in the paths section of
     * an OpenAPI document.
     *
     * Note that, combination of {@link AutoBeOpenApi.IOperation.path}
     * and {@link AutoBeOpenApi.IOperation.method} must be unique.
     *
     * Also, never forget any specification that list listed on the
     * requirement analysis report and DB design documents. Every
     * features must be implemented in the API operations.
     *
     * @minItems 1
     */
    operations: AutoBeOpenApi.IOperation[];

    /**
     * Reusable components of the API operations.
     *
     * This contains schemas, parameters, responses, and other reusable
     * elements referenced throughout the API operations. It corresponds
     * to the components section in an OpenAPI document.
     *
     * All request and response bodies must reference named types defined
     * in this components section. This ensures consistency and reusability
     * across the API.
     *
     * When defining components and their nested properties, please fill
     * {@link AutoBeOpenApi.IJsonSchema.description} properties as much and detail
     * as possible. The descriptions must be enough detailed and conceptually
     * clear that anyone who reads the document can understand the purpose
     * and usage of each type and property.
     *
     * ## Type Naming Conventions in Components
     *
     * When defining schema components, follow these standardized naming patterns
     * for consistency and clarity:
     *
     * ### Main Entity Types
     * - `IEntityName`
     *   - Primary entity objects (e.g., `IShoppingSale`, `IShoppingOrder`)
     *   - These represent the full, detailed version of domain entities
     *
     * ### Operation-Specific Types
     * - `IEntityName.ICreate`
     *   - Request body schemas for creation operations (POST)
     *   - Contains all fields needed to create a new entity
     * - `IEntityName.IUpdate`
     *   - Request body schemas for update operations (PUT)
     *   - Contains fields that can be modified on an existing entity
     * - `IEntityName.IRequest`
     *   - Parameters for search/filter/pagination in list operations
     *   - Often contains `search`, `sort`, `page`, and `limit` properties
     *
     * ### View Types
     * - `IEntityName.ISummary`
     *   - Simplified view of entities for list operations
     *   - Contains essential properties only, omitting detailed nested objects
     * - `IEntityName.IAbridge`: Intermediate view with more details than Summary but less than full entity
     * - `IEntityName.IInvert`: Alternative representation of an entity from a different perspective
     *
     * ### Container Types
     * - `IPageIEntityName`
     *   - Paginated results container
     *   - Usually contains `pagination` and `data` properties
     *
     * These naming conventions create a self-documenting API where the purpose
     * of each schema is immediately clear from its name. This helps both developers
     * and AI tools understand and maintain the API structure.
     */
    components: AutoBeOpenApi.IComponents;
  }

  /**
   * Operation of the Restful API.
   *
   * This interface defines a single API endpoint with its
   * HTTP {@link method}, {@link path}, {@link parameters path parameters},
   * {@link requestBody request body}, and {@link responseBody} structure.
   * It corresponds to an individual operation in the paths section of
   * an OpenAPI document.
   *
   * Each operation requires a detailed explanation of its purpose through
   * the reason and description fields, making it clear why the API was
   * designed and how it should be used.
   *
   * All request bodies and responses for this operation must be object types
   * and must reference named types defined in the components section.
   * The content-type is always `application/json`. For file upload/download
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
  export interface IOperation {
    /**
     * Specification of the API operation.
     *
     * Before defining the API operation interface, please describe
     * what you're planning to write in this `specification` field.
     *
     * The specification must be fully detailed and clear, so that anyone can
     * understand the purpose and functionality of the API operation and its
     * related components (e.g., {@link path}, {@link parameters}, {@link requestBody}).
     */
    specification: string;

    /**
     * HTTP path of the API operation.
     *
     * The URL path for accessing this API operation, using path parameters
     * enclsed in curly braces (e.g., `/shoppings/customers/sales/{saleId}`).
     *
     * It must be corresponded to the {@link parameters path parameters}.
     */
    path: string;

    /**
     * HTTP method of the API operation.
     *
     * Note that, if the API operation has {@link requestBody}, method must not be `get`.
     *
     * Also, even though the API operation has been designed to only get
     * information, but it needs complicated request information, it must
     * be defined as `patch` method with {@link requestBody} data specification.
     *
     * - `get`: get information
     * - `patch`: get information with complicated request data ({@link requestBody})
     * - `post`: create new record
     * - `put`: update existing record
     * - `delete`: remove record
     */
    method: "get" | "post" | "put" | "delete" | "patch";

    /**
     * Detailed description about the API operation.
     *
     * Please describe the API operation in a human-readable way,
     * and must be enough detailed to be used as a document.
     * This description will be used for the next step of viral coding,
     * implementation of e2e test functions and main program development.
     *
     * If there's a dependency to other APIs, please describe the
     * dependency API operation in this field with detailed reason.
     * For example, if this API operation needs a pre-execution of
     * other API operation, it must be explicitly described.
     *
     * - `GET /shoppings/customers/sales` must be pre-executed to
     *   get entire list of summarized sales. Detailed sale information
     *   would be obtained by specifying the sale ID in the path parameter.
     */
    description: string;

    /**
     * List of path parameters.
     *
     * Note that, the {@link AutoBeOpenApi.IParameter.name identifier name}
     * of path parameter must be corresponded to the
     * {@link path API operation path}.
     *
     * For example, if there's an API operation which has {@link path} of
     * `/shoppings/customers/sales/{saleId}/questions/${questionId}/comments/${commentId}`,
     * its list of {@link AutoBeOpenApi.IParameter.name path parameters}
     * must be like:
     *
     * - `saleId`
     * - `questionId`
     * - `commentId`
     */
    parameters: AutoBeOpenApi.IParameter[];

    /**
     * Request body of the API operation.
     *
     * Defines the payload structure for the request. Contains a description
     * and schema reference to define the expected input data.
     *
     * Should be `null` for operations that don't require a request body,
     * such as most "get" operations.
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
   * This interface defines a path parameter that appears in the URL of
   * an API endpoint. Path parameters are enclosed in curly braces in the
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
     * Provides context about what the parameter represents and its purpose
     * in the API operation. This helps API consumers understand how to use
     * the parameter correctly.
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
     * If you need other types, please use request body instead with
     * object type encapsulation.
     */
    schema:
      | AutoBeOpenApi.IJsonSchema.IInteger
      | AutoBeOpenApi.IJsonSchema.INumber
      | AutoBeOpenApi.IJsonSchema.IString;
  }

  /**
   * Request body information of OpenAPI operation.
   *
   * This interface defines the structure for request bodies in API routes.
   * It corresponds to the requestBody section in OpenAPI specifications,
   * providing both a description and schema reference for the request payload.
   *
   * The content-type for all request bodies is always `application/json`.
   * Even when file uploading is required, don't use `multipart/form-data`
   * or `application/x-www-form-urlencoded` content types. Instead, just
   * define an URI string property in the request body schema.
   *
   * Note that, all body schemas must be transformable to a
   * {@link AutoBeOpenApi.IJsonSchema.IReference reference} type defined in
   * the {@link AutoBeOpenApi.IComponents.scheams components section}
   * as an {@link AutoBeOpenApi.IJsonSchema.IObject object} type.
   *
   * In OpenAPI, this might represent:
   *
   * ```json
   * {
   *   "requestBody": {
   *     "description": "Creation info of the order",
   *     "content": {
   *       "application/json": {
   *         "schema": { "$ref": "#/components/schemas/IShoppingOrder.ICreate" }
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
     * This provides context about what the request body represents
     * and how it should be used.
     *
     * It appears in the OpenAPI documentation to help API consumers
     * understand the purpose of the payload.
     */
    description: string;

    /**
     * Request body type name.
     *
     * This specifies the data structure expected in the request body, that
     * will be transformed to {@link AutoBeOpenApi.IJsonSchema.IReference reference}
     * type in the {@link AutoBeOpenApi.IComponents.schemas components section}
     * as an {@link AutoBeOpenApi.IJsonSchema.Object object} type.
     *
     * Here is the naming convention for the request body type:
     *
     * - `IEntityName.ICreate`: Request body for creation operations (POST)
     * - `IEntityName.IUpdate`: Request body for update operations (PUT)
     * - `IEntityName.IRequest`: Request parameters for list operations (often with search/pagination)
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
   * This interface defines the structure of a successful response from
   * an API operation. It provides a description of the response and a schema
   * reference to define the returned data structure.
   *
   * The content-type for all responses is always `application/json`.
   * Even when file downloading is required, don't use `application/octet-stream`
   * or `multipart/form-data` content types. Instead, just define an URI string
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
     * Provides context about what the response represents and what it contains.
     *
     * This helps API consumers understand the structure and meaning of the
     * returned data.
     */
    description: string;

    /**
     * Response body's data type.
     *
     * Specifies the structure of the returned data (response body), that
     * will be transformed to {@link AutoBeOpenApi.IJsonSchema.IReference}
     * type in the {@link AutoBeOpenApi.IComponents.schemas components section}
     * as an {@link AutoBeOpenApi.IJsonSchema.IObject object} type.
     *
     * Here is the naming convention for the response body type:
     *
     * - `IEntityName`: Main entity with detailed information (e.g., `IShoppingSale`)
     * - `IEntityName.ISummary`: Simplified response version with essential properties
     * - `IEntityName.IInvert`: Alternative view of an entity from a different perspective
     * - `IPageIEntityName`: Paginated results container with `pagination` and `data` properties
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
     */
    schemas: Record<string, IJsonSchemaDescriptive>;

    /**
     * Whether includes `Authorization` header or not.
     */
    authorization?: "header" | undefined;
  }

  /**
   * Type schema info.
   *
   * `AutoBeOpenApi.IJsonSchema` is a type schema info of the OpenAPI Generative.
   *
   * `AutoBeOpenApi.IJsonSchema` basically follows the JSON schema specification
   * of OpenAPI v3.1, but a little bit shrunk to remove ambiguous and duplicated
   * expressions of OpenAPI v3.1 for the convenience, clarity, and AI generation.
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
    /**
     * Constant value type.
     */
    export interface IConstant extends IAttribute {
      /**
       * The constant value.
       */
      const: boolean | number | string;
    }

    /**
     * Boolean type info.
     */
    export interface IBoolean extends ISignificant<"boolean"> {}

    /**
     * Integer type info.
     */
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

      /**
       * Exclusive minimum value restriction.
       */
      exclusiveMinimum?: number;

      /**
       * Exclusive maximum value restriction.
       */
      exclusiveMaximum?: number;

      /**
       * Multiple of value restriction.
       *
       * @type uint64
       * @exclusiveMinimum 0
       */
      multipleOf?: number;
    }

    /**
     * Number (double) type info.
     */
    export interface INumber extends ISignificant<"number"> {
      /**
       * Minimum value restriction.
       */
      minimum?: number;

      /**
       * Maximum value restriction.
       */
      maximum?: number;

      /**
       * Exclusive minimum value restriction.
       */
      exclusiveMinimum?: number;

      /**
       * Exclusive maximum value restriction.
       */
      exclusiveMaximum?: number;

      /**
       * Multiple of value restriction.
       *
       * @exclusiveMinimum 0
       */
      multipleOf?: number;
    }

    /**
     * String type info.
     */
    export interface IString extends ISignificant<"string"> {
      /**
       * Format restriction.
       */
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

      /**
       * Pattern restriction.
       */
      pattern?: string;

      /**
       * Content media type restriction.
       */
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

    /**
     * Array type info.
     */
    export interface IArray extends ISignificant<"array"> {
      /**
       * Items type info.
       *
       * The `items` means the type of the array elements. In other words, it is
       * the type schema info of the `T` in the TypeScript array type `Array<T>`.
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

    /**
     * Object type info.
     */
    export interface IObject extends IAttribute {
      /**
       * Properties of the object.
       *
       * The `properties` means a list of key-value pairs of the object's
       * regular properties. The key is the name of the regular property,
       * and the value is the type schema info.
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
       * If the value is `false`, it means that the additional properties
       * are not specified. Otherwise, if the value is {@link IJsonSchema} type,
       * it means that the additional properties must follow the type schema info.
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
       * exists in the `required` list, it means that the property must be filled.
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

    /**
     * Reference type directing named schema.
     */
    export interface IReference extends IAttribute {
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
     * For reference, even though your Swagger (or OpenAPI) document has
     * defined `anyOf` instead of the `oneOf`, {@link AutoBeOpenApi} forcibly
     * converts it to `oneOf` type.
     */
    export interface IOneOf extends IAttribute {
      /**
       * List of the union types.
       */
      oneOf: Exclude<IJsonSchema, IJsonSchema.IOneOf>[];

      /**
       * Discriminator info of the union type.
       */
      discriminator?: IOneOf.IDiscriminator;
    }
    export namespace IOneOf {
      /**
       * Discriminator info of the union type.
       */
      export interface IDiscriminator {
        /**
         * Property name for the discriminator.
         */
        propertyName: string;

        /**
         * Mapping of the discriminator value to the schema name.
         *
         * This property is valid only for {@link IReference} typed
         * {@link IOneOf.oneof} elements. Therefore, `key` of `mapping` is
         * the discriminator value, and `value` of `mapping` is the
         * schema name like `#/components/schemas/SomeObject`.
         */
        mapping?: Record<string, string>;
      }
    }

    /**
     * Null type.
     */
    export interface INull extends ISignificant<"null"> {}

    interface ISignificant<Type extends string> extends IAttribute {
      /**
       * Discriminator value of the type.
       */
      type: Type;
    }
    interface IAttribute {
      /**
       * Description about the type.
       *
       * If you are planning to fill the description, the content must be
       * fully detailed and clear, so that anyone who reads the description
       * can understand the purpose and functionality of the type and how
       * it should be used.
       */
      description?: string;
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
   * and duplicated expressions of OpenAPI v3.1 for the convenience, clarity, and
   * AI generation.
   *
   * When filling the description, please make sure to provide fully detailed
   * and clear information, so that anyone who reads the description
   * can understand the purpose and functionality of the type.
   */
  export type IJsonSchemaDescriptive<Schema extends IJsonSchema = IJsonSchema> =
    Omit<Schema, "description"> & {
      /**
       * Description about the type.
       *
       * This provides context about what the type represents and how it
       * should be used. Please fill the description with fully detailed and
       * clear information, so that anyone who reads the description
       * can understand the purpose and functionality of the type.
       */
      description: string;
    };
}
