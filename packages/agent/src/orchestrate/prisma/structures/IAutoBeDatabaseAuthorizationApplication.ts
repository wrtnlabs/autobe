import { AutoBeDatabaseComponentTableDesign } from "@autobe/interface";
import { tags } from "typia";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseAuthorizationApplication {
  /**
   * Process authorization table design task for all actors or preliminary data
   * requests.
   *
   * Receives all actor definitions (name, kind, description for each) and
   * generates all authentication and authorization related tables for every
   * actor type (guest/member/admin) in a single call. This includes for each
   * actor:
   *
   * - The main actor table (e.g., users, administrators, guests)
   * - Session tables for JWT token management
   * - Authentication support tables (password reset, email verification, etc.)
   *
   * This agent is responsible for ALL actor-related tables. The Database
   * Component agent will NOT create any actor or authentication tables.
   *
   * @param props Request containing either preliminary data request or complete
   *   table design for all actors
   */
  process(props: IAutoBeDatabaseAuthorizationApplication.IProps): void;
}

export namespace IAutoBeDatabaseAuthorizationApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisSections,
     * getPreviousAnalysisSections, getPreviousDatabaseSchemas):
     *
     * - What critical information is missing for designing auth tables?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion (complete):
     *
     * - What tables did you design for this actor?
     * - How does the design support authentication workflows?
     * - Summarize - don't enumerate every single item.
     *
     * This reflection helps you avoid duplicate requests and premature
     * completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getAnalysisSections, getPreviousAnalysisSections,
     * getPreviousDatabaseSchemas) or final table design (complete). When
     * preliminary returns empty array, that type is removed from the union,
     * physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /**
   * Request to complete the authorization table design for all actors.
   *
   * Takes all actor definitions (name, kind, description for each) and
   * generates all database tables required for every actor's authentication and
   * authorization needs, including main actor tables, session tables, and any
   * authentication support tables for each actor.
   *
   * This is about creating tables for ALL actors in a single call. Each actor
   * must have at minimum a main actor table and a session table.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval or actual
     * task execution. Value "complete" indicates this is the final task
     * execution request.
     */
    type: "complete";

    /**
     * Analysis of all actors' authentication requirements.
     *
     * Documents the agent's understanding of each actor's authentication needs:
     *
     * - What actors exist and their kinds (guest/member/admin)?
     * - What authentication patterns apply to each actor kind?
     * - What authentication features are required (login, registration, etc.)?
     * - What are the session management requirements for each actor?
     * - Are there any special authentication mechanisms (2FA, OAuth, etc.)?
     */
    analysis: string;

    /**
     * Rationale for the authorization table design decisions.
     *
     * Explains why tables were designed this way:
     *
     * - Why was each table created for each actor?
     * - What is the relationship between actor and session tables?
     * - How do tables support the authentication workflow for all actors?
     * - What normalization decisions were made for auth-related data?
     */
    rationale: string;

    /**
     * Array of table designs for ALL ACTORS' authentication domains.
     *
     * Contains all database tables required for every actor's authentication
     * and authorization needs. Each table design includes table name
     * (snake_case, plural) and description explaining the table's purpose.
     *
     * The AI agent must design tables based on:
     *
     * - Each actor's kind (guest/member/admin) and its authentication patterns
     * - Authentication requirements from analysis sections
     * - Session management requirements (JWT, refresh tokens)
     * - Security requirements (password policies, 2FA)
     *
     * MUST include for EACH actor:
     *
     * - Main actor table (e.g., `users`, `administrators`, `guests`)
     * - Session table (e.g., `user_sessions`, `administrator_sessions`)
     *
     * MAY include (based on requirements):
     *
     * - Password reset tokens table
     * - Email verification tokens table
     * - OAuth connections table
     * - Two-factor authentication tokens table
     */
    tables: AutoBeDatabaseComponentTableDesign[] & tags.MinItems<1>;
  }
}
