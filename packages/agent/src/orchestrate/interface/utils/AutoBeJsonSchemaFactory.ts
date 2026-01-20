import { AutoBeDatabase, AutoBeOpenApi } from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import { OpenApi, OpenApiTypeChecker } from "@samchon/openapi";
import { OpenApiV3_1Emender } from "@samchon/openapi/lib/converters/OpenApiV3_1Emender";
import typia, { tags } from "typia";
import { v7 } from "uuid";

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
      if (parent === undefined) continue;
      else if (AutoBeOpenApiTypeChecker.isObject(parent) === false) continue;

      value.properties = {
        ...parent.properties,
        ...value.properties,
      };
      if (value.properties.token === undefined)
        value.properties.token = {
          $ref: "#/components/schemas/IAuthorizationToken",
          description: "Authorization token.",
        };
      value.required = Array.from(
        new Set([...parent.required, ...value.required]),
      );
      if (value.required.includes("id") === false) value.required.push("id");
      if (value.required.includes("token") === false)
        value.required.push("token");
    }
  };

  export const finalize = (props: {
    document: AutoBeOpenApi.IDocument;
    application: AutoBeDatabase.IApplication;
  }): void => {
    removeUnused(props.document);
    removeDuplicated(props.document);
    fixTimestamps(props);
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

  /* -----------------------------------------------------------
    PAGINATION
  ----------------------------------------------------------- */
  export const page = (
    key: string,
  ): AutoBeOpenApi.IJsonSchemaDescriptive.IObject => ({
    type: "object",
    properties: {
      pagination: {
        $ref: "#/components/schemas/IPage.IPagination",
        description: "Page information.",
      },
      data: {
        type: "array",
        items: {
          $ref: `#/components/schemas/${key}`,
        },
        description: "List of records.",
      },
    },
    required: ["pagination", "data"],
    description: StringUtil.trim`
      A page.
  
      Collection of records with pagination information.
    `,
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
          if (AutoBeOpenApiTypeChecker.isObject(next))
            next["x-autobe-database-schema"] = null;
        },
      });
    return init;
  })();

  /* -----------------------------------------------------------
    PLUGIN
  ----------------------------------------------------------- */
  export const fixSchema = <Schema extends AutoBeOpenApi.IJsonSchema>(
    value: Schema,
  ): Schema => {
    const id: string = v7();
    const emended: AutoBeOpenApi.IJsonSchema = (
      ((
        OpenApiV3_1Emender.convertComponents({
          schemas: {
            [id]: value,
          },
        }) as AutoBeOpenApi.IComponents
      ).schemas ?? {}) as Record<string, AutoBeOpenApi.IJsonSchema>
    )[id];
    AutoBeOpenApiTypeChecker.visit({
      components: {
        authorizations: [],
        schemas: {},
      },
      schema: emended,
      closure(next) {
        for (const k of Object.keys(next))
          if (
            k === "x-autobe-database-schema" &&
            AutoBeOpenApiTypeChecker.isObject(next)
          )
            continue;
          else if (k.startsWith("x-")) delete (next as any)[k];
        if (AutoBeOpenApiTypeChecker.isString(next)) fixStringSchema(next);
        else if (AutoBeOpenApiTypeChecker.isArray(next)) fixArraySchema(next);
      },
    });
    return emended as Schema;
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
}

namespace IPage {
  /** Page information. */
  export interface IPagination {
    /** Current page number. */
    current: number & tags.Type<"uint32">;

    /** Limitation of records per a page. */
    limit: number & tags.Type<"uint32">;

    /** Total records in the database. */
    records: number & tags.Type<"uint32">;

    /**
     * Total pages.
     *
     * Equal to {@link records} / {@link limit} with ceiling.
     */
    pages: number & tags.Type<"uint32">;
  }

  /** Page request data */
  export interface IRequest {
    /** Page number. */
    page?: null | (number & tags.Type<"uint32">);

    /**
     * Limitation of records per a page.
     *
     * @default 100
     */
    limit?: null | (number & tags.Type<"uint32">);
  }
}

/**
 * Authorization token response structure.
 *
 * This interface defines the structure of the authorization token response
 * returned after successful user authentication. It contains both access and
 * refresh tokens along with their expiration information.
 *
 * This token structure is automatically included in API schemas when the system
 * detects authorization actors in the requirements analysis phase. It provides
 * a standard format for JWT-based authentication across the generated backend
 * applications.
 */
interface IAuthorizationToken {
  /**
   * JWT access token for authenticated requests.
   *
   * This token should be included in the Authorization header for subsequent
   * authenticated API requests as `Bearer {token}`.
   */
  access: string;

  /**
   * Refresh token for obtaining new access tokens.
   *
   * This token can be used to request new access tokens when the current access
   * token expires, extending the user's session.
   */
  refresh: string;

  /**
   * Access token expiration timestamp.
   *
   * ISO 8601 date-time string indicating when the access token will expire and
   * can no longer be used for authentication.
   */
  expired_at: string & tags.Format<"date-time">;

  /**
   * Refresh token expiration timestamp.
   *
   * ISO 8601 date-time string indicating the latest time until which the
   * refresh token can be used to obtain new access tokens.
   */
  refreshable_until: string & tags.Format<"date-time">;
}

/** Just a base entity interface for referencing. */
interface IEntity {
  /** Primary Key. */
  id: string & tags.Format<"uuid">;
}
