import { AutoBeDatabaseGroupReviseCreate } from "./AutoBeDatabaseGroupReviseCreate";
import { AutoBeDatabaseGroupReviseErase } from "./AutoBeDatabaseGroupReviseErase";
import { AutoBeDatabaseGroupReviseUpdate } from "./AutoBeDatabaseGroupReviseUpdate";

/**
 * Group revision: create | update | erase.
 *
 * @author Michael
 */
export type AutoBeDatabaseGroupRevise =
  | AutoBeDatabaseGroupReviseCreate
  | AutoBeDatabaseGroupReviseUpdate
  | AutoBeDatabaseGroupReviseErase;
