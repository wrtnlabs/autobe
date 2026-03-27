import { SnakeCasePattern } from "../../typings/SnakeCasePattern";

/**
 * Rename an existing table in the component.
 *
 * @author Michael
 */
export interface AutoBeDatabaseComponentTableUpdate {
  /** Type discriminator. */
  type: "update";

  /** Why this rename is needed. Keep concise — one or two sentences. */
  reason: string;

  /** Original table name. Must match exactly from current component. */
  original: string & SnakeCasePattern;

  /** New table name in snake_case with domain prefix. */
  updated: string & SnakeCasePattern;

  /** Updated description. Keep concise. MUST be in English. */
  description: string;
}
