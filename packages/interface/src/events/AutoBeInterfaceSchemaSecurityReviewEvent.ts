import { AutoBeOpenApi } from "../openapi";
import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeProgressEventBase } from "./AutoBeProgressEventBase";
import { AutoBeTokenUsageEventBase } from "./AutoBeTokenUsageEventBase";

/**
 * Event fired during the security review phase of OpenAPI schema generation
 * process.
 *
 * This event represents the specialized security validation activity of the
 * Interface Schema Security Review Agent, which focuses exclusively on
 * authentication boundaries, data protection, and system integrity. The agent
 * ensures that schemas meet the highest security standards by preventing
 * authentication bypass, data exposure, and unauthorized access.
 *
 * The Interface Schema Security Review Agent performs targeted validation
 * including:
 *
 * - Authentication context field removal from request DTOs (e.g., bbs_member_id,
 *   session_id)
 * - Password and token field removal from response DTOs
 * - System-managed field protection from client manipulation
 * - Phantom field detection and removal (fields not in Prisma schema)
 * - Validation using x-autobe-prisma-schema linkage
 *
 * Security enforcement priorities:
 *
 * - **CRITICAL**: Remove authentication context from requests (prevents
 *   impersonation)
 * - **CRITICAL**: Remove passwords/tokens from responses (prevents data leaks)
 * - **CRITICAL**: Remove phantom fields (ensures database consistency)
 * - **HIGH**: Protect system-managed fields (maintains data integrity)
 *
 * Key characteristics of the security review:
 *
 * - Zero-tolerance for authentication context in request bodies
 * - Strict enforcement of JWT/session-based authentication
 * - Complete removal of sensitive data from responses
 * - Validation against actual Prisma schema structure
 *
 * The review ensures that all DTOs enforce proper authentication boundaries
 * where user identity comes exclusively from verified tokens, never from request
 * bodies, preventing critical security vulnerabilities.
 *
 * @author Kakasoo
 */
export interface AutoBeInterfaceSchemaSecurityReviewEvent
  extends AutoBeEventBase<"interfaceSchemaSecurityReview">,
    AutoBeProgressEventBase,
    AutoBeTokenUsageEventBase {
  /**
   * Original schemas submitted for security review.
   *
   * Contains the OpenAPI schemas that need security validation, including all
   * DTOs that may contain authentication context fields, sensitive data, or
   * system-managed fields requiring protection.
   */
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

  /**
   * Security violation findings from the review.
   *
   * Documents all security issues discovered, categorized by severity:
   *
   * - CRITICAL: Authentication context in requests, passwords in responses,
   *   phantom fields
   * - HIGH: System-managed fields in requests, immutable fields in updates
   * - MEDIUM: Missing security constraints
   * - LOW: Documentation security warnings
   *
   * Each violation includes the schema name, field name, and specific security
   * rule violated.
   */
  review: string;

  /**
   * Security remediation plan applied.
   *
   * Outlines the specific security fixes implemented to address identified
   * violations. Lists all fields removed, modified, or protected to ensure
   * security compliance.
   *
   * If schemas were already secure, explicitly states that no security fixes
   * were required.
   */
  plan: string;

  /**
   * Schemas modified for security compliance.
   *
   * Contains ONLY the schemas that were actively modified to fix security
   * violations. Schemas that passed security validation without changes are not
   * included.
   *
   * An empty object {} indicates all schemas were already secure.
   */
  content: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

  /**
   * Current iteration number of the schema generation being reviewed.
   *
   * Indicates which version of the schemas is undergoing security review,
   * helping track the iterative security hardening process.
   */
  step: number;
}