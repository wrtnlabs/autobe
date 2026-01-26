import { AutoBeDatabaseComponent } from "../histories";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event emitted when authorization tables are generated for a specific actor.
 *
 * This event is dispatched for each actor type (guest/member/admin) during
 * the database authorization phase. Each event contains the complete set of
 * authentication and authorization tables for that specific actor, including
 * the main actor table, session table, and any authentication support tables.
 *
 * @author Samchon
 */
export interface AutoBeDatabaseAuthorizationEvent
  extends
    AutoBeEventBase<"databaseAuthorization">,
    AutoBeAggregateEventBase,
    AutoBeProgressEventBase {
  /**
   * Analysis of the actor's authentication requirements.
   *
   * Documents the agent's understanding of the actor's authentication needs:
   *
   * - Actor kind (guest/member/admin) and its authentication patterns
   * - What authentication features are required (login, registration, etc.)
   * - Session management requirements
   * - Any special authentication mechanisms (2FA, OAuth, etc.)
   */
  analysis: string;

  /**
   * Rationale for the authorization table design decisions.
   *
   * Explains why the authorization design was made this way, including why
   * certain tables were created, how the actor kind influenced the design,
   * what normalization principles were applied, and how tables support the
   * authentication workflow.
   */
  rationale: string;

  /**
   * The name of the actor this authorization component is for.
   *
   * This is the actor name as defined in the requirements analysis,
   * e.g., "user", "admin", "customer", "seller".
   */
  actorName: string;

  /**
   * The kind/category of the actor.
   *
   * Determines the authentication pattern for this actor:
   *
   * - "guest": Unauthenticated users with minimal permissions
   * - "member": Authenticated users with standard access
   * - "admin": System administrators with elevated permissions
   */
  actorKind: "guest" | "member" | "admin";

  /**
   * The completed database component with authorization table designs.
   *
   * Contains all database tables required for this actor's authentication
   * and authorization needs. The component includes:
   *
   * - Main actor table (e.g., `users`, `administrators`)
   * - Session table (e.g., `user_sessions`)
   * - Any authentication support tables (password_resets, etc.)
   */
  component: AutoBeDatabaseComponent;

  /**
   * Iteration number of the requirements analysis this authorization
   * was performed for.
   *
   * Indicates which version of the requirements analysis this table
   * generation reflects. This step number ensures that the authorization
   * tables are aligned with the current requirements and helps track the
   * evolution of authentication architecture as business requirements change.
   */
  step: number;
}
