import { SnakeCasePattern } from "../../typings/SnakeCasePattern";

/**
 * Add a missing table to the component.
 *
 * @author Michael
 */
export interface AutoBeDatabaseComponentTableCreate {
  /** Type discriminator. */
  type: "create";

  /** Why this table is needed. Keep concise — one or two sentences. */
  reason: string;

  /** Table name in snake_case with domain prefix. */
  table: string & SnakeCasePattern;

  /** Business purpose of this table. Keep concise. MUST be in English. */
  description: string;
}
