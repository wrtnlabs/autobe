import { AutoBeDatabaseComponentTableCreate } from "./AutoBeDatabaseComponentTableCreate";
import { AutoBeDatabaseComponentTableErase } from "./AutoBeDatabaseComponentTableErase";
import { AutoBeDatabaseComponentTableUpdate } from "./AutoBeDatabaseComponentTableUpdate";

/**
 * Table revision operation type.
 *
 * Discriminated union representing all possible table modifications during the
 * component review phase. Review agents examine generated tables and return an
 * array of these operations to correct issues:
 *
 * - **Create**: Add missing tables that fulfill requirements
 * - **Update**: Fix incorrectly named tables (rename operations)
 * - **Erase**: Remove invalid or misplaced tables
 *
 * @author Michael
 */
export type AutoBeDatabaseComponentTableRevise =
  | AutoBeDatabaseComponentTableCreate
  | AutoBeDatabaseComponentTableUpdate
  | AutoBeDatabaseComponentTableErase;
