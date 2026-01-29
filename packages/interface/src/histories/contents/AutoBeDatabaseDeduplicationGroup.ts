/**
 * Represents a group of semantically duplicate tables identified across
 * different database components.
 *
 * Each group contains tables from different components that serve the same
 * purpose or store the same kind of data, even if they have different names.
 * The deduplication agent identifies these groups by analyzing both table names
 * and descriptions to determine semantic equivalence.
 *
 * After identification, the system resolves each group by keeping only the
 * table from the component with the fewest total tables (most specialized),
 * ensuring deterministic and fair deduplication.
 *
 * @author Michael
 */
export interface AutoBeDatabaseDeduplicationGroup {
  /**
   * Explanation of why these tables are considered semantically duplicate.
   *
   * Should describe the shared purpose or functionality that makes these tables
   * redundant, referencing their names and descriptions.
   */
  reason: string;

  /**
   * List of tables that serve the same purpose across different components.
   *
   * Must contain at least 2 tables, and at least one must belong to the target
   * component being reviewed.
   */
  tables: AutoBeDatabaseDeduplicationGroup.ITable[];
}

export namespace AutoBeDatabaseDeduplicationGroup {
  /**
   * Reference to a specific table within a specific component.
   *
   * Used to uniquely identify a table by its component namespace and table
   * name.
   */
  export interface ITable {
    /**
     * The namespace of the component that owns this table.
     *
     * Must match an existing component's namespace (e.g., "Authorization",
     * "Sales", "Orders").
     */
    namespace: string;

    /**
     * The snake_case name of the table.
     *
     * Must match an existing table name within the specified component.
     */
    name: string;
  }
}
