import { tags } from "typia";

import { CamelPattern } from "../../typings/CamelPattern";

/**
 * Interface representing a user role definition in the requirements analysis
 * phase.
 *
 * This interface defines authenticated user roles that will be used throughout
 * the application's authentication and authorization system. Each role
 * represents a distinct type of user who can register, authenticate, and
 * interact with the system based on their specific permissions and
 * capabilities.
 *
 * The roles defined here serve as the foundation for generating:
 *
 * - Prisma schema models for user authentication tables
 * - API endpoint access control decorators
 * - Role-based authorization logic in the business layer
 * - Test scenarios for different user permission levels
 *
 * @author Kakasoo
 */
export interface AutoBeAnalyzeRole {
  /**
   * Unique identifier for the user role.
   *
   * This name will be used as a reference throughout the generated codebase,
   * including Prisma schema model names, authorization decorator parameters,
   * and API documentation.
   *
   * MUST use camelCase naming convention.
   */
  name: string & CamelPattern & tags.MinLength<1>;

  /**
   * Human-readable description of the role's permissions and capabilities.
   *
   * This description helps the AI agents understand the business context and
   * access requirements for each role, guiding the generation of appropriate
   * authorization rules and API endpoint restrictions.
   */
  description: string;

  /**
   * Role category classification for system-wide permission hierarchy.
   *
   * This property categorizes roles into three fundamental permission levels,
   * establishing a clear hierarchy for authorization decisions throughout the
   * application. The kind determines baseline access patterns and security
   * boundaries:
   *
   * - "guest": Unauthenticated users or those with minimal permissions. Typically
   *   limited to public resources and registration/login endpoints.
   * - "member": Authenticated users with standard access permissions. Can access
   *   personal resources and participate in core application features.
   * - "admin": System administrators with elevated permissions. Can manage other
   *   users, access administrative functions, and modify system-wide settings.
   */
  kind: "guest" | "member" | "admin";
}
