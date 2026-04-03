import { AutoBeDatabaseSchemaDefinition } from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseSchemaApplication {
  /**
   * Process schema generation task.
   *
   * @param props Preliminary data request, write submission, or completion
   *   confirmation
   */
  process(props: IAutoBeDatabaseSchemaApplication.IProps): void;
}
export namespace IAutoBeDatabaseSchemaApplication {
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

  /** Submit production-ready database schema models for validation. */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /**
     * Database design plan for the target table and any child tables (1NF
     * decomposition).
     *
     * Child table naming: singular form of targetTable as prefix (e.g.,
     * "shopping_order_items"). Never recreate existing tables from
     * otherComponents. Strict 1NF/2NF/3NF adherence. Junction tables:
     * {table1}_{table2}. Materialized views: mv_ prefix.
     */
    plan: string;

    /**
     * Schema definition with exactly one
     * {@link AutoBeDatabaseSchemaDefinition.model} (the target table).
     * Additional child tables go in
     * {@link AutoBeDatabaseSchemaDefinition.newDesigns} as name + description
     * pairs.
     *
     * Key rules: UUID "id" primary keys, data types limited to
     * uuid/string/int/double/ datetime/boolean/uri, no derived values, strict
     * 3NF, mv_ prefix for materialized views, consistent
     * created_at/updated_at/deleted_at, PlainIndexes never single FK.
     */
    definition: AutoBeDatabaseSchemaDefinition;
  }
}

/** @deprecated Use IAutoBeDatabaseSchemaApplication.IWrite instead. */
export type IAutoBeDatabaseSchemaApplicationComplete =
  IAutoBeDatabaseSchemaApplication.IWrite;
