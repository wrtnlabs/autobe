import { PascalCasePattern } from "../../typings/PascalCasePattern";

/**
 * JWT token payload type definition for an actor.
 *
 * @author Michael
 */
export interface AutoBeRealizeAuthorizationPayload {
  /** Payload type name in PascalCase (e.g., "AdminPayload", "UserPayload"). */
  name: string & PascalCasePattern;

  /** File path for the generated payload type. */
  location: string;

  /** Complete TypeScript source code of the payload interface. */
  content: string;
}
