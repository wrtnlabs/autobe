import { AutoBeDatabaseGroupReviseCreate } from "./AutoBeDatabaseGroupReviseCreate";
import { AutoBeDatabaseGroupReviseErase } from "./AutoBeDatabaseGroupReviseErase";
import { AutoBeDatabaseGroupReviseUpdate } from "./AutoBeDatabaseGroupReviseUpdate";

/**
 * Group revision operation type.
 *
 * Discriminated union representing all possible group modifications during the
 * group review phase. The review agent examines generated component group
 * skeletons and returns an array of these operations to correct issues:
 *
 * - **Create**: Add missing groups for uncovered business domains
 * - **Update**: Fix group properties (namespace, filename, kind, reasoning)
 * - **Erase**: Remove unnecessary or redundant groups
 *
 * @author Michael
 */
export type AutoBeDatabaseGroupRevise =
  | AutoBeDatabaseGroupReviseCreate
  | AutoBeDatabaseGroupReviseUpdate
  | AutoBeDatabaseGroupReviseErase;
