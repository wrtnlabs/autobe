import { AutoBeDatabaseComponent } from "../histories";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

/**
 * Event emitted when authorization tables are generated for all actors.
 *
 * This event is dispatched once during the database authorization phase,
 * containing the complete set of authentication and authorization tables for
 * ALL actor types (guest/member/admin) in a single component. This includes
 * main actor tables, session tables, and authentication support tables for
 * every actor defined in the requirements.
 *
 * @author Samchon
 */
export interface AutoBeDatabaseAuthorizationEvent
  extends AutoBeEventBase<"databaseAuthorization">, AutoBeAggregateEventBase {
  /**
   * Analysis of all actors' authentication requirements.
   *
   * Documents the agent's understanding of the authentication needs for all
   * actors:
   *
   * - Each actor's kind (guest/member/admin) and its authentication patterns
   * - What authentication features are required (login, registration, etc.)
   * - Session management requirements for each actor type
   * - Any special authentication mechanisms (2FA, OAuth, etc.)
   */
  analysis: string;

  /**
   * Rationale for the authorization table design decisions.
   *
   * Explains why the authorization design was made this way, including why
   * certain tables were created, how each actor kind influenced the design,
   * what normalization principles were applied, and how tables support the
   * authentication workflow for all actors.
   */
  rationale: string;

  /**
   * The completed database component with authorization table designs.
   *
   * Contains all database tables required for ALL actors' authentication and
   * authorization needs. The component includes for each actor:
   *
   * - Main actor table (e.g., `users`, `administrators`, `guests`)
   * - Session table (e.g., `user_sessions`, `administrator_sessions`)
   * - Any authentication support tables (password_resets, etc.)
   */
  component: AutoBeDatabaseComponent;

  /**
   * Iteration number of the requirements analysis this authorization was
   * performed for.
   *
   * Indicates which version of the requirements analysis this table generation
   * reflects. This step number ensures that the authorization tables are
   * aligned with the current requirements and helps track the evolution of
   * authentication architecture as business requirements change.
   */
  step: number;
}
