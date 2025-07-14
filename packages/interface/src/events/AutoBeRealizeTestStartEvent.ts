import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Realize agent begins executing the comprehensive E2E
 * test suite to validate the complete backend implementation.
 *
 * This event marks the initiation of the final validation phase in the AutoBE
 * pipeline, where all previously generated Test agent E2E test functions are
 * executed against the fully implemented backend application. The realize test
 * process represents the critical quality gate that validates the entire
 * application stack from API endpoints through business logic to database
 * interactions.
 *
 * The test execution process validates that the Realize agent's implementation
 * correctly fulfills all business requirements, API contracts, and data model
 * specifications by running real-world scenarios against the living
 * application. This comprehensive validation ensures that the generated backend
 * application is production-ready and functionally correct.
 *
 * @author Samchon
 */
export interface AutoBeRealizeTestStartEvent
  extends AutoBeEventBase<"realizeTestStart"> {
  /**
   * Whether the test execution will begin with a clean database reset.
   *
   * Indicates if the test suite will start by performing a complete database
   * reset to ensure clean testing conditions. When true, all existing data will
   * be purged and database tables will be reconstructed to their initial state
   * before test execution begins.
   *
   * Database reset is essential for ensuring test isolation and
   * reproducibility, preventing test interference caused by residual data from
   * previous executions or development activities. Clean state testing
   * guarantees that test results are deterministic and accurately reflect the
   * application's behavior under controlled conditions.
   */
  reset: boolean;

  /**
   * Number of test functions that will be executed simultaneously.
   *
   * Specifies the concurrent execution limit for E2E test functions to optimize
   * testing performance while maintaining system stability. This value
   * determines how many test operations can run in parallel, balancing test
   * execution speed with resource consumption and potential race conditions.
   *
   * Parallel execution significantly reduces total testing time for large test
   * suites while ensuring that the backend application can handle concurrent
   * requests correctly. The simultaneous limit prevents system overload and
   * maintains test reliability under controlled load conditions.
   */
  simultaneous: number;

  /**
   * Iteration number of the requirements analysis this test execution
   * validates.
   *
   * Indicates which version of the requirements analysis this comprehensive
   * test execution is validating. This step number ensures that the test
   * validation is aligned with the current implementation state and helps track
   * the validation of different development iterations.
   *
   * The step value serves as the definitive reference for understanding which
   * requirements version is being validated through the complete backend
   * implementation, ensuring that stakeholders can correlate test results with
   * specific development milestones and requirement iterations.
   */
  step: number;
}
