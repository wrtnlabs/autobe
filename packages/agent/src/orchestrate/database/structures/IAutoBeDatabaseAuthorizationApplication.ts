import { AutoBeDatabaseComponentTableDesign } from "@autobe/interface";
import { tags } from "typia";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

/**
 * Designs ALL actor-related authentication tables. The Database Component agent
 * will NOT create any actor or authentication tables — this agent owns that
 * scope entirely.
 */
export interface IAutoBeDatabaseAuthorizationApplication {
  /**
   * Process authorization table design task.
   *
   * @param props Preliminary data request, write submission, or completion
   *   confirmation
   */
  process(props: IAutoBeDatabaseAuthorizationApplication.IProps): void;
}

export namespace IAutoBeDatabaseAuthorizationApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * For preliminary requests: what information is missing and why?
     *
     * For write: what you're submitting and key design decisions.
     *
     * For complete: why you consider the last write final.
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union, physically preventing repeated calls.
     */
    request:
      | IWrite
      | IAutoBePreliminaryComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /** Submit authorization table design. */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /** Analysis of all actors' authentication requirements and patterns. */
    analysis: string;

    /** Rationale for the authorization table design decisions. */
    rationale: string;

    /**
     * Table designs for all actors' authentication domains (snake_case, plural
     * names).
     *
     * MUST include for each actor: main actor table + session table. MAY
     * include: password reset, email verification, OAuth, 2FA tables.
     */
    tables: AutoBeDatabaseComponentTableDesign[] & tags.MinItems<1>;
  }
}

/** @deprecated Use IAutoBeDatabaseAuthorizationApplication.IWrite instead. */
export type IAutoBeDatabaseAuthorizationApplicationComplete =
  IAutoBeDatabaseAuthorizationApplication.IWrite;
