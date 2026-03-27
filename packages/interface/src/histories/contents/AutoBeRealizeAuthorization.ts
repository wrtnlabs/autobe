import { AutoBeAnalyze } from "../../analyze/AutoBeAnalyze";
import { AutoBeRealizeAuthorizationDecorator } from "./AutoBeRealizeAuthorizationDecorator";
import { AutoBeRealizeAuthorizationPayload } from "./AutoBeRealizeAuthorizationPayload";
import { AutoBeRealizeAuthorizationProvider } from "./AutoBeRealizeAuthorizationProvider";

/**
 * Complete authorization implementation for a specific actor.
 *
 * @author Michael
 */
export interface AutoBeRealizeAuthorization {
  /** Actor definition from requirements analysis. */
  actor: AutoBeAnalyze.IActor;

  /** NestJS parameter decorator for route protection. */
  decorator: AutoBeRealizeAuthorizationDecorator;

  /** JWT token payload structure. */
  payload: AutoBeRealizeAuthorizationPayload;

  /** Authorization provider function (JWT verification, role validation). */
  provider: AutoBeRealizeAuthorizationProvider;
}
