import { SnakeCasePattern } from "../../typings/SnakeCasePattern";

/**
 * Table design with name and description.
 *
 * @author Michael
 */
export interface AutoBeDatabaseComponentTableDesign {
  /**
   * Business purpose of this table. One or two sentences maximum. MUST be
   * written in English.
   */
  description: string;

  /** Table name in snake_case with domain prefix (e.g., "shopping_customers"). */
  name: string & SnakeCasePattern;
}
