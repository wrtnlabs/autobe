import { PascalCasePattern } from "../../typings/PascalCasePattern";

/**
 * NestJS parameter decorator for actor-based authorization.
 *
 * Actor-specific (e.g., ShoppingCustomerAuth, AdminAuth).
 *
 * @author Michael
 */
export interface AutoBeRealizeAuthorizationDecorator {
  /** Decorator name in PascalCase (e.g., "ShoppingCustomerAuth", "AdminAuth"). */
  name: string & PascalCasePattern;

  /** File path for the generated decorator. */
  location: string;

  /** Complete TypeScript source code of the decorator. */
  content: string;
}
