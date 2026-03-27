import { AutoBeDatabaseComponentTableCreate } from "./AutoBeDatabaseComponentTableCreate";
import { AutoBeDatabaseComponentTableErase } from "./AutoBeDatabaseComponentTableErase";
import { AutoBeDatabaseComponentTableUpdate } from "./AutoBeDatabaseComponentTableUpdate";

/**
 * Table revision: create | update (rename) | erase.
 *
 * @author Michael
 */
export type AutoBeDatabaseComponentTableRevise =
  | AutoBeDatabaseComponentTableCreate
  | AutoBeDatabaseComponentTableUpdate
  | AutoBeDatabaseComponentTableErase;
