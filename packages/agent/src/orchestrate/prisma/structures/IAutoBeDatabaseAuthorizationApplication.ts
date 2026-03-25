import { AutoBeDatabaseComponentTableDesign } from "@autobe/interface";
import { tags } from "typia";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseAuthorizationApplication {
  /** Process authorization table design task or retrieve preliminary data. */
  process(props: IAutoBeDatabaseAuthorizationApplication.IProps): void;
}

export namespace IAutoBeDatabaseAuthorizationApplication {
  export interface IProps {
    /**
     * Reasoning about your current state: what's missing (preliminary) or what
     * you accomplished (completion).
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union.
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
