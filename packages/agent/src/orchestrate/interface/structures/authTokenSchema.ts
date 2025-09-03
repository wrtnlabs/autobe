import { AutoBeOpenApi } from "@autobe/interface";
import typia, { tags } from "typia";

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

export const authTokenSchema: AutoBeOpenApi.IJsonSchemaDescriptive =
  typia.json.schema<IAuthorizationToken>().components.schemas!
    .IAuthorizationToken as AutoBeOpenApi.IJsonSchemaDescriptive;
