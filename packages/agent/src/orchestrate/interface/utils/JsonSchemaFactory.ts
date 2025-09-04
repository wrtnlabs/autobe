import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import typia, { tags } from "typia";

export namespace JsonSchemaFactory {
  export const presets = (
    typeNames: string[],
  ): Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> => {
    return {
      ...DEFAULT_SCHEMAS,
      ...Object.fromEntries(
        typeNames.filter(isPage).map((key) => [key, page(key)]),
      ),
    };
  };

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
  });

  export const fix = (path: string, input: unknown): void => {
    if (isRecord(input) === false || isRecord(input[path]) === false) return;

    if (input[path].description) delete input[path].description;
    if (input[path].required) delete input[path].required;

    for (const key of Object.keys(input[path]))
      if (DEFAULT_SCHEMAS[key] !== undefined)
        input[path][key] = DEFAULT_SCHEMAS[key];
      else if (isPage(key) === true) {
        const data: string = key.substring("IPage".length);
        input[path][key] = page(data);
      }
  };

  export const isPage = (key: string): boolean =>
    key.startsWith("IPage") === true &&
    key.startsWith("IPage.") === false &&
    key !== "IPage";

  const isRecord = (input: unknown): input is Record<string, unknown> =>
    typeof input === "object" && input !== null;
}

const DEFAULT_SCHEMAS = typia.assertEquals<
  Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>
>(
  typia.json.schemas<[IPage.IPagination, IAuthorizationToken]>().components
    ?.schemas,
);

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
}

/**
 * Authorization token response structure.
 *
 * This interface defines the structure of the authorization token response
 * returned after successful user authentication. It contains both access and
 * refresh tokens along with their expiration information.
 *
 * This token structure is automatically included in API schemas when the system
 * detects authorization roles in the requirements analysis phase. It provides a
 * standard format for JWT-based authentication across the generated backend
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
