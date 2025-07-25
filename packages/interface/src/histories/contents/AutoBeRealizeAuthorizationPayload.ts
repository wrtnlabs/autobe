/**
 * Authorization payload structure for authentication tokens.
 *
 * This interface represents the data structure used in JWT tokens or session
 * payloads to carry user identity and authorization information. The payload
 * is a critical component of the authentication system, containing all necessary
 * data for making authorization decisions throughout the application lifecycle.
 *
 * Payloads typically include user identification, role information, permissions,
 * token expiration, and any custom claims required by the business logic. The
 * structure must balance security (minimal sensitive data) with functionality
 * (sufficient data for authorization decisions).
 *
 * @author Michael
 */
export interface AutoBeRealizeAuthorizationPayload {
  /**
   * The name of the payload type or interface (e.g., 'JwtPayload').
   *
   * This identifier is used to create the TypeScript interface name in the
   * generated code. For example, 'JwtPayload' would generate an interface
   * that defines the structure of data stored in JWT tokens, ensuring
   * type safety throughout the authentication flow.
   */
  name: string;

  /**
   * File path where the payload interface will be generated.
   *
   * Specifies the absolute path in the project structure where this
   * payload type definition will be written. The path typically follows
   * the pattern 'src/auth/interfaces/{name}.interface.ts' to maintain
   * consistent project organization and separation of concerns.
   */
  location: string;

  /**
   * Complete source code of the payload interface definition.
   *
   * Contains the full TypeScript interface definition, including:
   * - Import statements for any required types
   * - Interface declaration with proper typing
   * - Essential fields like userId, role, and permissions
   * - Optional fields for custom claims or metadata
   * - JSDoc comments for each field explaining its purpose
   * 
   * The interface ensures type safety when encoding and decoding
   * authentication tokens throughout the application.
   */
  content: string;
}
