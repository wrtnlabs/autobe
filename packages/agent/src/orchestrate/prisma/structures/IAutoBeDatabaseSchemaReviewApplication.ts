import { AutoBeDatabaseSchemaDefinition } from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseSchemaReviewApplication {
  /** Process schema review task or retrieve preliminary data. */
  process(props: IAutoBeDatabaseSchemaReviewApplication.IProps): void;
}
export namespace IAutoBeDatabaseSchemaReviewApplication {
  export interface IProps {
    /**
     * Reasoning: what's missing (preliminary), what you're submitting (write),
     * or why you're finalizing (complete).
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union.
     */
    request:
      | IWrite
      | IAutoBePreliminaryComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /** Submit database schema review. */
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
