import { SnakeCasePattern } from "../../typings/SnakeCasePattern";

/**
 * Table design with name and description.
 *
 * Represents a single table identified during the component extraction phase,
 * pairing the table name with a description of its purpose. This type
 * formalizes the table design structure for database schema generation.
 *
 * The description provides business context that helps:
 *
 * - Review agents validate that the table fulfills actual requirements
 * - Schema generation create appropriate models with proper documentation
 * - Future developers understand the table's role in the system
 *
 * @author Michael
 */
export interface AutoBeDatabaseComponentTableDesign {
  /**
   * Name of the database table.
   *
   * Must follow snake_case naming convention with appropriate domain prefix.
   * Examples: `shopping_customers`, `bbs_articles`, `order_items`
   */
  name: string & SnakeCasePattern;

  /**
   * Description of what this table stores and why it's needed.
   *
   * Should explain:
   *
   * - What business concept this table represents
   * - What data it stores
   * - Why this table is necessary for the component's domain
   *
   * **IMPORTANT**: Description must be written in English.
   *
   * @example
   *   "Stores customer profile information including authentication
   *   credentials, contact details, and preferences for the shopping platform."
   */
  description: string;
}
