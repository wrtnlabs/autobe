import { SnakeCasePattern } from "../../typings/SnakeCasePattern";

/**
 * Remove a table from the component.
 *
 * @author Michael
 */
export interface AutoBeDatabaseComponentTableErase {
  /** Type discriminator. */
  type: "erase";

  /** Why this table should be removed. Keep concise — one or two sentences. */
  reason: string;

  /** Table name to remove. Must match exactly from current component. */
  table: string & SnakeCasePattern;
}
