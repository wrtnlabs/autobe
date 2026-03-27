import { AutoBeOpenApi } from "../../openapi";

/**
 * JWT-based authentication operations generated for a specific actor.
 *
 * @author Michael
 */
export interface AutoBeInterfaceAuthorization {
  /** Actor name (e.g., "user", "admin", "seller"). */
  name: string;

  /** Authentication API operations for this actor (join, login, refresh, etc.). */
  operations: AutoBeOpenApi.IOperation[];
}
