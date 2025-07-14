import { tags } from "typia";

import { IAutoBeRealizeTestOperation } from "../compiler/IAutoBeRealizeTestOperation";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Realize agent completes the entire E2E test suite
 * execution, finalizing the comprehensive validation of the backend
 * implementation.
 *
 * This event represents the successful completion of the final validation phase
 * in the AutoBE pipeline, where all Test agent-generated E2E test functions
 * have been executed against the fully implemented backend application. The
 * completion marks the end of comprehensive functional validation that verifies
 * the entire application stack from API endpoints through business logic to
 * database interactions.
 *
 * The test suite completion provides the definitive assessment of whether the
 * generated backend application meets all business requirements, API contracts,
 * and data model specifications. This comprehensive validation result
 * determines the production readiness of the generated application and
 * identifies any remaining issues that need resolution.
 *
 * @author Samchon
 */
export interface AutoBeRealizeTestCompleteEvent
  extends AutoBeEventBase<"realizeTestComplete"> {
  /**
   * Comprehensive results of all executed test operations with detailed outcome
   * information.
   *
   * Contains the complete collection of {@link IAutoBeRealizeTestOperation}
   * results representing every E2E test function that was executed during the
   * validation process. Each operation result includes detailed information
   * about test execution outcomes, return values, error conditions, timing
   * data, and validation status.
   *
   * This comprehensive result set provides stakeholders with complete
   * visibility into the validation process, enabling detailed analysis of which
   * functionality passed validation, which tests failed, and what specific
   * issues were encountered during the testing process. The operation results
   * serve as the authoritative record of backend implementation quality and
   * compliance with established requirements.
   */
  operations: IAutoBeRealizeTestOperation[];

  /**
   * Timestamp when the entire test suite execution was completed.
   *
   * Records the exact moment when all planned E2E test operations finished
   * execution, marking the completion of the comprehensive validation process.
   * This timestamp represents the definitive end point of the AutoBE
   * development pipeline validation phase and provides audit trail information
   * for the complete development cycle.
   *
   * The completion timestamp is essential for performance analysis of the
   * entire test suite, understanding total validation duration, and maintaining
   * comprehensive audit trails of the development and validation process. It
   * serves as the official completion marker for stakeholders tracking project
   * delivery milestones.
   */
  completed_at: string & tags.Format<"date-time">;

  /**
   * Final iteration number of the requirements analysis that was
   * comprehensively validated through this test execution.
   *
   * Indicates which version of the requirements analysis was fully validated
   * through the complete E2E test suite execution. This step number represents
   * the definitive synchronization point between requirements, implementation,
   * and validation, confirming that all aspects of the specified requirements
   * version have been tested and validated.
   *
   * The step value serves as the authoritative reference for the completed
   * validation scope, ensuring that all stakeholders understand which
   * requirements version has been comprehensively tested and validated through
   * the complete backend implementation. This final step number marks the
   * completion milestone for the entire AutoBE development and validation
   * cycle.
   */
  step: number;
}
