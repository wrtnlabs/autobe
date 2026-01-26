import { AutoBeDatabaseComponentTableDesign } from "@autobe/interface";
import { tags } from "typia";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseAuthorizationApplication {
  /**
   * Process authorization table design task for a specific actor or preliminary
   * data requests.
   *
   * Receives a single actor definition (name, kind, description) and generates
   * all authentication and authorization related tables for that actor type
   * (guest/member/admin). This includes:
   *
   * - The main actor table (e.g., users, administrators)
   * - Session tables for JWT token management
   * - Authentication support tables (password reset, email verification, etc.)
   *
   * This agent is responsible for ALL actor-related tables. The Database
   * Component agent will NOT create any actor or authentication tables.
   *
   * @param props Request containing either preliminary data request or complete
   *   table design
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
     * For preliminary requests (getAnalysisFiles, getPreviousAnalysisFiles,
     * getPreviousDatabaseSchemas):
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
     * (getAnalysisFiles, getPreviousAnalysisFiles, getPreviousDatabaseSchemas)
     * or final table design (complete). When preliminary returns empty array,
     * that type is removed from the union, physically preventing repeated
     * calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /**
   * Request to complete the authorization table design for a specific actor.
   *
   * Takes an actor definition (name, kind, description already provided) and
   * generates all database tables required for this actor's authentication and
   * authorization needs, including the main actor table, session table, and any
   * authentication support tables.
   *
   * This is NOT about creating tables for multiple actors - the actor identity
   * is fixed. This is ONLY about designing the tables that belong to this
   * single actor.
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
     * Analysis of the actor's authentication requirements.
     *
     * Documents the agent's understanding of the actor's authentication needs:
     *
     * - What is the actor kind (guest/member/admin) and its authentication
     *   patterns?
     * - What authentication features are required (login, registration, etc.)?
     * - What are the session management requirements?
     * - Are there any special authentication mechanisms (2FA, OAuth, etc.)?
     */
    analysis: string;

    /**
     * Rationale for the authorization table design decisions.
     *
     * Explains why tables were designed this way:
     *
     * - Why was each table created?
     * - What is the relationship between actor and session tables?
     * - How do tables support the authentication workflow?
     * - What normalization decisions were made for auth-related data?
     */
    rationale: string;

    /**
     * Array of table designs for THIS ACTOR's authentication domain.
     *
     * Contains all database tables required for the actor's authentication and
     * authorization needs. Each table design includes table name (snake_case,
     * plural) and description explaining the table's purpose.
     *
     * The AI agent must design tables based on:
     *
     * - The actor's kind (guest/member/admin) and its authentication patterns
     * - Authentication requirements from analysis files
     * - Session management requirements (JWT, refresh tokens)
     * - Security requirements (password policies, 2FA)
     *
     * MUST include:
     *
     * - Main actor table (e.g., `users`, `administrators`)
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
