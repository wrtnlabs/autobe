import { AutoBeDatabaseSchemaDefinition } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IComplete } from "../../common/structures/IComplete";

export interface IAutoBeDatabaseSchemaReviewApplication {
  /** Process schema review task or retrieve preliminary data. */
  process(props: IAutoBeDatabaseSchemaReviewApplication.IProps): void;
}
export namespace IAutoBeDatabaseSchemaReviewApplication {
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
      | IWrite
      | IComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /**
   * Submit database schema review for validation.
   */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /**
     * Review analysis covering normalization, relationships, indexes, naming,
     * and business alignment.
     */
    review: string;

    /**
     * Database design plan serving as the blueprint for validating the
     * implemented schema.
     */
    plan: string;

    /**
     * Corrected schema definition, or null if no changes are needed.
     *
     * When not null, carries exactly one corrected
     * {@link AutoBeDatabaseSchemaDefinition.model}. Additional child tables go
     * in {@link AutoBeDatabaseSchemaDefinition.newDesigns}.
     */
    content: AutoBeDatabaseSchemaDefinition | null;
  }
}

/** @deprecated Use IAutoBeDatabaseSchemaReviewApplication.IWrite instead. */
export type IAutoBeDatabaseSchemaReviewApplicationComplete =
  IAutoBeDatabaseSchemaReviewApplication.IWrite;
