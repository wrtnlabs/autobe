import { AutoBeDatabaseSchemaDefinition } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseSchemaApplication {
  /**
   * Process schema generation task or retrieve preliminary data.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeDatabaseSchemaApplication.IProps): void;
}
export namespace IAutoBeDatabaseSchemaApplication {
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
   * Generate production-ready database schema models with normalization and
   * indexing.
   */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

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
