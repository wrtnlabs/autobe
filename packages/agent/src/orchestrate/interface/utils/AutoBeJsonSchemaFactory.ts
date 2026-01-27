import {
  AutoBeDatabase,
  AutoBeInterfaceSchemaDesign,
  AutoBeOpenApi,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import { OpenApi, OpenApiTypeChecker } from "@samchon/openapi";
import { OpenApiV3_1Emender } from "@samchon/openapi/lib/converters/OpenApiV3_1Emender";
import typia, { tags } from "typia";
import { v7 } from "uuid";

import { AutoBeInterfaceSchemaProgrammer } from "../programmers/AutoBeInterfaceSchemaProgrammer";
import { AutoBeJsonSchemaValidator } from "./AutoBeJsonSchemaValidator";

export namespace AutoBeJsonSchemaFactory {
  /* -----------------------------------------------------------
    ASSIGNMENTS
  ----------------------------------------------------------- */
  export const presets = (
    typeNames: Set<string>,
  ): Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> => {
    const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
    for (const [key, value] of Object.entries(DEFAULT_SCHEMAS)) {
      schemas[key] = value;
      typeNames.delete(key);
    }
    for (const key of typeNames)
      if (AutoBeJsonSchemaValidator.isPage(key)) {
        const data: string = getPageName(key);
        schemas[key] = page(data);
        typeNames.delete(key);
        typeNames.add(data);
      }
    return schemas;
  };

  export const authorize = (
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
  ): void => {
    for (const [key, value] of Object.entries(schemas)) {
      if (key.endsWith(".IAuthorized") === false) continue;
      else if (AutoBeOpenApiTypeChecker.isObject(value) === false) continue;

      const parent: AutoBeOpenApi.IJsonSchemaDescriptive | undefined =
        schemas[key.replace(".IAuthorized", "")];
      if (
        parent === undefined ||
        AutoBeOpenApiTypeChecker.isObject(parent) === false
      ) {
        value.properties.token = {
          "x-autobe-specification":
            "Authorization token comes from the session table.",
          description: "Authorization token.",
          $ref: "#/components/schemas/IAuthorizationToken",
        };
        if (value.required.includes("token") === false)
          value.required.push("token");
      } else {
        value.properties = {
          ...parent.properties,
          ...value.properties,
        };
        if (value.properties.token === undefined)
          value.properties.token = {
            "x-autobe-specification":
              "Authorization token comes from the session table.",
            description: "Authorization token.",
            $ref: "#/components/schemas/IAuthorizationToken",
          };
        value.required = Array.from(
          new Set([...parent.required, ...value.required]),
        );
        if (value.required.includes("id") === false) value.required.push("id");
        if (value.required.includes("token") === false)
          value.required.push("token");
      }
    }
  };

  export const finalize = (props: {
    document: AutoBeOpenApi.IDocument;
    application: AutoBeDatabase.IApplication;
  }): void => {
    removeUnused(props.document);
    removeDuplicated(props.document);
    fixTimestamps(props);
    linkRelatedModels(props);
  };

  const removeUnused = (document: AutoBeOpenApi.IDocument): void => {
    while (true) {
      const used: Set<string> = new Set();
      const visit = (schema: AutoBeOpenApi.IJsonSchema): void =>
        OpenApiTypeChecker.visit({
          components: { schemas: document.components.schemas },
          schema,
          closure: (next) => {
            if (OpenApiTypeChecker.isReference(next)) {
              const key: string = next.$ref.split("/").pop()!;
              used.add(key);
            }
          },
        });
      for (const op of document.operations) {
        if (op.requestBody !== null)
          visit({
            $ref: `#/components/schemas/${op.requestBody.typeName}`,
          });
        if (op.responseBody !== null)
          visit({
            $ref: `#/components/schemas/${op.responseBody.typeName}`,
          });
      }

      const complete: boolean =
        Object.keys(document.components.schemas).length === 0 ||
        Object.keys(document.components.schemas).every(
          (key) => used.has(key) === true,
        );
      if (complete === true) break;
      for (const key of Object.keys(document.components.schemas))
        if (used.has(key) === false) delete document.components.schemas[key];
    }
  };

  const removeDuplicated = (document: AutoBeOpenApi.IDocument): void => {
    // gather duplicated schemas
    const correct: Map<string, string> = new Map();
    for (const key of Object.keys(document.components.schemas)) {
      if (key.includes(".") === false) continue;
      const dotRemoved: string = key.replace(".", "");
      if (document.components.schemas[dotRemoved] === undefined) continue;
      correct.set(dotRemoved, key);
    }

    // fix operations' references
    for (const op of document.operations) {
      if (op.requestBody && correct.has(op.requestBody.typeName))
        op.requestBody.typeName = correct.get(op.requestBody.typeName)!;
      if (op.responseBody && correct.has(op.responseBody.typeName))
        op.responseBody.typeName = correct.get(op.responseBody.typeName)!;
    }

    // fix schemas' references
    const $refChangers: Map<OpenApi.IJsonSchema, () => void> = new Map();
    for (const value of Object.values(document.components.schemas))
      OpenApiTypeChecker.visit({
        components: { schemas: document.components.schemas },
        schema: value,
        closure: (next) => {
          if (OpenApiTypeChecker.isReference(next) === false) return;
          const x: string = next.$ref.split("/").pop()!;
          const y: string | undefined = correct.get(x);
          if (y === undefined) return;
          $refChangers.set(
            next,
            () => (next.$ref = `#/components/schemas/${y}`),
          );
        },
      });
    for (const fn of $refChangers.values()) fn();

    // remove duplicated schemas
    for (const key of correct.keys()) delete document.components.schemas[key];
  };

  const fixTimestamps = (props: {
    document: AutoBeOpenApi.IDocument;
    application: AutoBeDatabase.IApplication;
  }): void => {
    const entireModels: AutoBeDatabase.IModel[] = props.application.files
      .map((f) => f.models)
      .flat();
    for (const value of Object.values(props.document.components.schemas)) {
      if (AutoBeOpenApiTypeChecker.isObject(value) === false) continue;

      const model: AutoBeDatabase.IModel | undefined = value[
        "x-autobe-database-schema"
      ]
        ? entireModels.find((m) => m.name === value["x-autobe-database-schema"])
        : undefined;
      if (model === undefined) continue;

      const properties: string[] = Object.keys(value.properties);
      for (const key of properties) {
        if (
          key !== "created_at" &&
          key !== "updated_at" &&
          key !== "deleted_at"
        )
          continue;
        const column: AutoBeDatabase.IPlainField | undefined =
          model.plainFields.find((c) => c.name === key);
        if (column === undefined) delete value.properties[key];
      }
    }
  };

  const linkRelatedModels = (props: {
    document: AutoBeOpenApi.IDocument;
    application: AutoBeDatabase.IApplication;
  }): void => {
    const modelDict: Set<string> = new Set(
      props.application.files
        .map((f) => f.models)
        .flat()
        .map((m) => m.name),
    );
    for (const [key, value] of Object.entries(
      props.document.components.schemas,
    )) {
      if (
        AutoBeOpenApiTypeChecker.isObject(value) === false ||
        !!value["x-autobe-database-schema"]?.length
      )
        continue;

      const typeName: string = key.split(".")[0]!.substring(1);
      const modelName: string =
        AutoBeInterfaceSchemaProgrammer.getDatabaseSchemaName(typeName);
      if (modelDict.has(modelName) === true)
        value["x-autobe-database-schema"] = modelName;
    }
  };

  /* -----------------------------------------------------------
    PAGINATION
  ----------------------------------------------------------- */
  export const page = (
    key: string,
  ): AutoBeOpenApi.IJsonSchemaDescriptive.IObject => ({
    type: "object",
    properties: {
      pagination: {
        "x-autobe-specification": "Pagination information for the page.",
        description: "Page information.",
        $ref: "#/components/schemas/IPage.IPagination",
      },
      data: {
        "x-autobe-specification": `List of records of type ${key}.`,
        description: "List of records.",
        type: "array",
        items: {
          $ref: `#/components/schemas/${key}`,
        },
      },
    },
    required: ["pagination", "data"],
    description: StringUtil.trim`
      A page.
  
      Collection of records with pagination information.
    `,
    "x-autobe-specification": `A page containing records of type ${key}.`,
    "x-autobe-database-schema": null, // filled by relation review agent
  });

  export const fixPage = (path: string, input: unknown): void => {
    if (isRecord(input) === false || isRecord(input[path]) === false) return;
    if (input[path].description) delete input[path].description;
    if (input[path].required) delete input[path].required;

    for (const key of Object.keys(input[path]))
      if (DEFAULT_SCHEMAS[key] !== undefined)
        input[path][key] = DEFAULT_SCHEMAS[key];
      else if (AutoBeJsonSchemaValidator.isPage(key) === true) {
        const data: string = key.substring("IPage".length);
        input[path][key] = page(data);
      }
  };

  export const getPageName = (key: string): string =>
    key.substring("IPage".length);

  const isRecord = (input: unknown): input is Record<string, unknown> =>
    typeof input === "object" && input !== null;

  export const DEFAULT_SCHEMAS = (() => {
    const init: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
      (typia.json.schemas<
        [IPage.IPagination, IPage.IRequest, IAuthorizationToken, IEntity]
      >().components?.schemas ?? {}) as Record<
        string,
        AutoBeOpenApi.IJsonSchemaDescriptive
      >;
    for (const value of Object.values(init))
      AutoBeOpenApiTypeChecker.visit({
        components: {
          schemas: init,
          authorizations: [],
        },
        schema: value,
        closure: (next) => {
          if (AutoBeOpenApiTypeChecker.isObject(next)) {
            next["x-autobe-database-schema"] = null;
          }
        },
      });
    return init;
  })();

  /* -----------------------------------------------------------
    PLUGIN
  ----------------------------------------------------------- */
  export const fixDesign = (
    design: AutoBeInterfaceSchemaDesign,
  ): AutoBeOpenApi.IJsonSchemaDescriptive => {
    const emended: AutoBeOpenApi.IJsonSchema = fixSchema(design.schema);
    const final: AutoBeOpenApi.IJsonSchemaDescriptive = {
      ...emended,
      description: design.description,
      "x-autobe-specification": design.specification,
    };
    if (AutoBeOpenApiTypeChecker.isObject(final))
      final["x-autobe-database-schema"] = design.databaseSchema;
    return final;
  };

  export const fixSchema = <Schema extends AutoBeOpenApi.IJsonSchema>(
    schema: Schema,
  ): Schema => {
    const id: string = v7();
    const emended: AutoBeOpenApi.IJsonSchema = (
      ((
        OpenApiV3_1Emender.convertComponents({
          schemas: {
            [id]: schema,
          },
        }) as AutoBeOpenApi.IComponents
      ).schemas ?? {}) as Record<string, AutoBeOpenApi.IJsonSchema>
    )[id];

    const visited: WeakSet<object> = new WeakSet();
    if (AutoBeOpenApiTypeChecker.isObject(emended)) {
      visited.add(emended);
      for (const v of Object.values(emended.properties)) visited.add(v);
    }

    AutoBeOpenApiTypeChecker.visit({
      components: {
        authorizations: [],
        schemas: {},
      },
      schema: emended,
      closure(next) {
        if (visited.has(next) === false)
          for (const k of Object.keys(next))
            if (k.startsWith("x-")) delete (next as any)[k];
        if (AutoBeOpenApiTypeChecker.isString(next)) fixStringSchema(next);
        else if (AutoBeOpenApiTypeChecker.isArray(next)) fixArraySchema(next);
        else if (AutoBeOpenApiTypeChecker.isInteger(next))
          fixIntegerSchema(next);
        else if (AutoBeOpenApiTypeChecker.isNumber(next)) fixNumberSchema(next);
      },
    });
    return emended as Schema;
  };

  const convertConst = (
    schema:
      | AutoBeOpenApi.IJsonSchema.INumber
      | AutoBeOpenApi.IJsonSchema.IInteger,
    value: number,
  ): void => {
    const description: string | undefined = (schema as any).description;

    for (const key of Object.keys(schema)) {
      delete (schema as any)[key];
    }

    (schema as any).const = value;
    if (description !== undefined) {
      (schema as any).description = description;
    }
  };

  const fixStringSchema = (schema: AutoBeOpenApi.IJsonSchema.IString): void => {
    if (schema.format !== undefined) {
      delete schema.pattern;
      if (
        schema.format === "uuid" ||
        schema.format === "ipv4" ||
        schema.format === "ipv6" ||
        schema.format === "date" ||
        schema.format === "date-time" ||
        schema.format === "time"
      ) {
        delete schema.minLength;
        delete schema.maxLength;
        delete schema.contentMediaType;
      }
    }
    if (schema.contentMediaType === "") delete schema.contentMediaType;
    if (schema.minLength === 0) delete schema.minLength;
  };

  const fixArraySchema = (schema: AutoBeOpenApi.IJsonSchema.IArray): void => {
    if (schema.minItems === 0) delete schema.minItems;
  };

  /**
   * Fix integer schema by converting single valid value ranges to const.
   *
   * Handles:
   *
   * - Minimum === maximum → const
   * - Minimum: N, exclusiveMaximum: N+1 → const N
   * - ExclusiveMinimum: N-1, maximum: N → const N
   * - ExclusiveMinimum: N-1, exclusiveMaximum: N+1 → const N
   */
  const fixIntegerSchema = (
    schema: AutoBeOpenApi.IJsonSchema.IInteger,
  ): void => {
    const value: number | undefined = (() => {
      if (schema.minimum !== undefined && schema.maximum === schema.minimum)
        return schema.minimum;
      if (
        schema.minimum !== undefined &&
        schema.exclusiveMaximum === schema.minimum + 1
      )
        return schema.minimum;
      if (
        schema.maximum !== undefined &&
        schema.exclusiveMinimum === schema.maximum - 1
      )
        return schema.maximum;
      if (
        schema.exclusiveMinimum !== undefined &&
        schema.exclusiveMaximum === schema.exclusiveMinimum + 2
      )
        return schema.exclusiveMinimum + 1;
      return undefined;
    })();

    if (value !== undefined) convertConst(schema, value);
  };

  /**
   * Fix number schema by converting single valid value ranges to const.
   *
   * Handles:
   *
   * - Minimum === maximum → const
   */
  const fixNumberSchema = (schema: AutoBeOpenApi.IJsonSchema.INumber): void => {
    // minimum === maximum → const
    if (
      schema.minimum !== undefined &&
      schema.maximum !== undefined &&
      schema.minimum === schema.maximum
    )
      return convertConst(schema, schema.minimum);
  };
}

namespace IPage {
  /**
   * Pagination metadata containing current page position and total data
   * statistics.
   *
   * This interface provides comprehensive pagination information returned
   * alongside paginated list data. It enables clients to implement navigation
   * controls, display progress indicators, and determine data boundaries for UI
   * rendering.
   *
   * @x-autobe-specification Pagination metadata for paginated list responses. Included in all list endpoint responses.
   */
  export interface IPagination {
    /**
     * Current page number being viewed (1-indexed).
     *
     * Indicates which page of results is currently being returned. Page
     * numbering starts from 1, so the first page is page 1 (not 0). This value
     * reflects the page parameter from the request after validation and bounds
     * checking.
     *
     * @x-autobe-specification 1-indexed current page number. Defaults to 1.
     */
    current: number & tags.Type<"uint32">;

    /**
     * Maximum number of records per page.
     *
     * Defines the upper bound on how many records can be returned in a single
     * page. This corresponds to the limit parameter from the request. The
     * actual number of records in the data array may be less than this value on
     * the final page or when total records are fewer than the limit.
     *
     * @x-autobe-specification Maximum records per page. Actual count may be less on last page.
     */
    limit: number & tags.Type<"uint32">;

    /**
     * Total count of all records matching the query criteria.
     *
     * Represents the complete number of records available across all pages, not
     * just the current page. This value is computed via a COUNT query and is
     * essential for calculating total pages and displaying pagination UI
     * elements like "Showing 1-10 of 150 results".
     *
     * @x-autobe-specification Total record count across all pages.
     */
    records: number & tags.Type<"uint32">;

    /**
     * Total number of pages available.
     *
     * Calculated as ceiling of {@link records} divided by {@link limit}. When
     * records is 0, pages will also be 0. This value enables clients to render
     * page navigation controls and validate page bounds.
     *
     * @x-autobe-specification Total pages. Calculated as Math.ceil(records / limit).
     */
    pages: number & tags.Type<"uint32">;
  }

  /**
   * Pagination request parameters for list endpoints.
   *
   * Defines the query parameters used to control pagination when requesting
   * list data. Both parameters are optional with sensible defaults, allowing
   * clients to fetch data without specifying pagination if default behavior is
   * acceptable.
   *
   * @x-autobe-specification Pagination query parameters for list endpoints. All fields optional.
   */
  export interface IRequest {
    /**
     * Target page number to retrieve (1-indexed).
     *
     * Specifies which page of results to return. Page numbering starts from 1.
     * If omitted, null, or undefined, defaults to page 1 (first page).
     * Requesting a page beyond the available range returns an empty data array
     * with valid pagination metadata reflecting the actual totals.
     *
     * @x-autobe-specification 1-indexed page number. Defaults to 1 if not provided.
     */
    page?: null | (number & tags.Type<"uint32">);

    /**
     * Maximum number of records to return per page.
     *
     * Controls how many records are included in each page response. If omitted,
     * null, or undefined, defaults to 100 records per page. The server may
     * enforce upper bounds to prevent excessive resource consumption on large
     * requests.
     *
     * @default 100
     *
     * @x-autobe-specification Maximum records per page. Defaults to 100 if not provided.
     */
    limit?: null | (number & tags.Type<"uint32">);
  }
}

/**
 * JWT-based authorization token pair with expiration metadata.
 *
 * Provides a complete authentication token structure containing both access and
 * refresh tokens along with their respective expiration timestamps. This
 * dual-token pattern enables secure, stateless authentication with automatic
 * session renewal capabilities.
 *
 * The access token is short-lived for security, while the refresh token allows
 * obtaining new access tokens without requiring the user to re-enter
 * credentials. This structure is automatically included in authentication
 * responses across all generated backend applications.
 *
 * @x-autobe-specification Dual-token authentication structure with access/refresh tokens and expiration info.
 */
interface IAuthorizationToken {
  /**
   * Short-lived JWT access token for authenticating API requests.
   *
   * This token must be included in the Authorization header using the Bearer
   * scheme (e.g., `Authorization: Bearer {access}`) for all endpoints requiring
   * authentication. The token contains encoded claims including user identity,
   * roles, and permissions. Typically expires within 15-60 minutes for
   * security; use the refresh token to obtain a new access token when expired.
   *
   * @x-autobe-specification JWT access token. Use in Authorization header as "Bearer {access}".
   */
  access: string;

  /**
   * Long-lived refresh token for obtaining new access tokens.
   *
   * Used to request new access tokens when the current access token expires,
   * allowing session continuation without re-authentication. Should be stored
   * securely and transmitted only to the token refresh endpoint. Typical
   * lifetime ranges from 7 to 30 days depending on security requirements.
   *
   * @x-autobe-specification Refresh token for obtaining new access tokens without re-authentication.
   */
  refresh: string;

  /**
   * ISO 8601 timestamp when the access token expires.
   *
   * After this timestamp, the access token will be rejected by authenticated
   * endpoints. Clients should proactively refresh before expiration to maintain
   * seamless user experience. A common strategy is to refresh when remaining
   * time falls below 5 minutes. This timestamp is also embedded within the JWT
   * itself as the "exp" claim.
   *
   * @x-autobe-specification Access token expiration timestamp in ISO 8601 format.
   */
  expired_at: string & tags.Format<"date-time">;

  /**
   * ISO 8601 timestamp indicating the absolute session expiration deadline.
   *
   * Represents the latest possible time the refresh token can be used. Once
   * this timestamp is reached, the user must fully re-authenticate with
   * credentials. This defines the maximum session duration regardless of
   * activity. If refresh token rotation is enabled, this deadline may extend
   * with each successful refresh.
   *
   * @x-autobe-specification Refresh token expiration timestamp. Re-authentication required after this time.
   */
  refreshable_until: string & tags.Format<"date-time">;
}

/**
 * Base entity interface providing standard primary key identification.
 *
 * Serves as the foundational interface for all database entities in the
 * generated application. Every model and record type extends this interface,
 * ensuring consistent identification semantics across all database tables and
 * API responses.
 *
 * @x-autobe-specification Base interface for all database entities. Contains the primary key.
 */
interface IEntity {
  /**
   * Unique identifier for this entity (UUID format).
   *
   * Auto-generated primary key using UUID format. This value is assigned by the
   * system upon record creation and cannot be modified afterward. All foreign
   * key relationships in the database reference this field.
   *
   * @x-autobe-specification Primary key in UUID format. Auto-generated, read-only.
   */
  id: string & tags.Format<"uuid">;
}
