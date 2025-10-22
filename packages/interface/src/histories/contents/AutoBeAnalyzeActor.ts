import { tags } from "typia";

import { CamelCasePattern } from "../../typings/CamelCasePattern";

/**
 * Interface representing a user actor definition in the requirements analysis
 * phase.
 *
 * This interface defines authenticated user actors that will be used throughout
 * the application's authentication and authorization system. Each actor
 * represents a distinct type of user who can register, authenticate, and
 * interact with the system based on their specific permissions and
 * capabilities.
 *
 * The actors defined here serve as the foundation for generating:
 *
 * - Prisma schema models for user authentication tables
 * - API endpoint access control decorators
 * - Actor-based authorization logic in the business layer
 * - Test scenarios for different user permission levels
 *
 * @author Kakasoo
 */
export interface AutoBeAnalyzeActor {
  /**
   * Unique identifier for the user actor.
   *
   * This name will be used as a reference throughout the generated codebase,
   * including Prisma schema model names, authorization decorator parameters,
   * and API documentation.
   *
   * MUST use camelCase naming convention.
   */
  name: string & CamelCasePattern & tags.MinLength<1>;

  /**
   * Actor category classification for system-wide permission hierarchy.
   *
   * This property categorizes actors into three fundamental permission levels,
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

  /**
   * Human-readable description of the actor's permissions and capabilities.
   *
   * This description helps the AI agents understand the business context and
   * access requirements for each actor, guiding the generation of appropriate
   * authorization rules and API endpoint restrictions.
   */
  description: string;
}
