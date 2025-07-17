import { tags } from "typia";

import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Realize agent completes the database reset process
 * before executing E2E test functions.
 *
 * This event occurs when the database has been successfully reset to a clean
 * state as preparation for comprehensive E2E test execution. The reset process
 * involves completely purging all existing data from the database and
 * reconstructing all tables to their initial schema-defined state, ensuring
 * that subsequent test executions operate under controlled, predictable
 * conditions.
 *
 * Database reset is a critical prerequisite for reliable test execution,
 * eliminating any residual data that could interfere with test scenarios or
 * cause non-deterministic test results. This clean slate approach guarantees
 * that each test execution cycle starts from an identical baseline state,
 * enabling accurate validation of the backend implementation's behavior.
 *
 * @author Samchon
 */
export interface AutoBeRealizeTestResetEvent
  extends AutoBeEventBase<"realizeTestReset"> {
  /**
   * Timestamp when the database reset operation was completed.
   *
   * Records the exact moment when the database reset process finished
   * successfully, marking the transition to clean testing conditions. This
   * timestamp serves as a reference point for understanding the test execution
   * timeline and ensuring proper sequencing of test operations.
   *
   * The completion timestamp is essential for performance analysis, debugging
   * test execution issues, and maintaining audit trails of test preparation
   * activities. It provides stakeholders with visibility into the test setup
   * duration and helps identify potential database performance bottlenecks.
   */
  completed_at: string & tags.Format<"date-time">;

  /**
   * Iteration number of the requirements analysis this database reset supports.
   *
   * Indicates which version of the requirements analysis this database reset is
   * preparing to validate. This step number ensures that the clean database
   * state is aligned with the current implementation version and helps track
   * the validation of different development iterations.
   *
   * The step value enables proper correlation between database reset activities
   * and the specific requirements version being tested, ensuring that test
   * preparation activities are synchronized with the current development
   * milestone and implementation state.
   */
  step: number;
}
