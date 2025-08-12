import { PascalPattern } from "../../typings/PascalPattern";

/**
 * Authorization decorator implementation for role-based access control.
 *
 * This interface represents a custom TypeScript decorator that can be applied
 * to NestJS controllers, routes, or methods to enforce authorization policies.
 * The decorator integrates with NestJS's guard system and metadata reflection
 * to protect endpoints based on user roles and permissions.
 *
 * Generated decorators are role-specific and include domain-specific names like
 *
 * @author Michael
 * @ShoppingCustomerAuth(), @BbsModeratorAuth(), @AdminAuth(), or other custom
 * decorators that work in conjunction with authorization guards to validate
 * user access before executing protected operations.
 */
export interface AutoBeRealizeAuthorizationDecorator {
  /**
   * The name of the authorization decorator (e.g., 'ShoppingCustomerAuth',
   * 'BbsModeratorAuth').
   *
   * This identifier is used to create the decorator function name in the
   * generated code. For example, a name of 'ShoppingCustomerAuth' would
   * generate a
   *
   * @ShoppingCustomerAuth() decorator that can be applied to controllers and routes
   * to enforce shopping customer-specific authorization policies.
   */
  name: string & PascalPattern;

  /**
   * File path where the decorator will be generated.
   *
   * Specifies the absolute path in the project structure where this decorator
   * implementation will be written. The path typically follows the pattern
   * 'src/auth/decorators/{name}.decorator.ts' to maintain consistent project
   * organization and follow NestJS conventions.
   */
  location: string;

  /**
   * Complete source code of the decorator implementation.
   *
   * Contains the full TypeScript code for the decorator, including:
   *
   * - Import statements for NestJS decorators and metadata
   * - The decorator factory function with proper typing
   * - Metadata setting logic using SetMetadata or custom implementation
   * - Export statements for use throughout the application
   *
   * The code is production-ready and follows TypeScript best practices for
   * decorator implementation.
   */
  content: string;
}
