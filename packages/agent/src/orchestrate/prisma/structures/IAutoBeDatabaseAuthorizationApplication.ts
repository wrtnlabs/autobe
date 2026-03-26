import { AutoBeDatabaseComponentTableDesign } from "@autobe/interface";
import { tags } from "typia";

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
   * Process authorization table design task or preliminary data requests.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeDatabaseAuthorizationApplication.IProps): void;
}

export namespace IAutoBeDatabaseAuthorizationApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * For preliminary requests: what critical information is missing and why?
     * Be brief — state the gap, don't list everything you have.
     *
     * For completion: what key assets did you acquire, what did you accomplish,
     * why is it sufficient? Summarize — don't enumerate every single item.
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /**
   * Complete authorization table design for all actors. Each actor must have a
   * main actor table and a session table.
   */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

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
