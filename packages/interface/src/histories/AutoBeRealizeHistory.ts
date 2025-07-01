import { tags } from "typia";

import { IAutoBeTypeScriptCompileResult } from "../compiler/IAutoBeTypeScriptCompileResult";
import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

/**
 * History record generated when the Realize agent implements the actual
 * business logic and service layer code based on the previous requirements
 * analysis, database design, API specification, and test scenarios.
 *
 * The Realize agent transforms the complete architectural foundation into
 * working application code by implementing service methods, business logic,
 * data access patterns, and integration logic. This represents the final step
 * in the vibe coding pipeline where all previous design artifacts converge into
 * executable software.
 *
 * The Realize agent ensures that the generated implementation correctly
 * fulfills all business requirements while maintaining consistency with the
 * database schema, API contracts, and test expectations established in previous
 * development phases.
 *
 * @author Samchon
 */
export interface AutoBeRealizeHistory
  extends AutoBeAgentHistoryBase<"realize"> {
  /**
   * Generated implementation files as key-value pairs.
   *
   * Contains the complete set of TypeScript implementation files including
   * service classes, business logic methods, data access objects, and
   * integration code. Each key represents the file path and each value contains
   * the actual implementation code that brings the designed system to life.
   *
   * The implementation files bridge the gap between API specifications and
   * database schemas, providing the concrete business logic that makes the
   * application functional and ready for deployment.
   */
  files: Record<string, string>;

  /**
   * Results of compiling the generated implementation code using the embedded
   * TypeScript compiler.
   *
   * Contains the compilation outcome of the implementation files built through
   * the TypeScript compiler. The implementation code must successfully compile
   * and integrate with the previously generated API controllers, DTOs, and
   * database schemas to ensure a cohesive, working application.
   *
   * Compilation errors trigger a feedback loop where the AI receives detailed
   * error messages and attempts to correct implementation issues while
   * maintaining alignment with the established architectural contracts.
   */
  compiled: IAutoBeTypeScriptCompileResult;

  /**
   * Reason why the Realize agent was activated through function calling.
   *
   * Explains the specific circumstances that triggered the AI chatbot to invoke
   * the Realize agent via function calling. This could include reasons such as
   * initial implementation generation after API and test completion, updating
   * business logic due to requirement changes, or regenerating implementation
   * to reflect modified API specifications or database schemas.
   */
  reason: string;

  /**
   * Iteration number of the requirements analysis report this implementation
   * was written for.
   *
   * Indicates which version of the requirements analysis this implementation
   * reflects. If this value is lower than {@link AutoBeAnalyzeHistory.step}, it
   * means the implementation has not yet been updated to reflect the latest
   * requirements and may need regeneration.
   *
   * A value of 0 indicates the initial implementation, while higher values
   * represent subsequent revisions based on updated requirements, API changes,
   * database schema modifications, or test scenario updates.
   */
  step: number;

  /**
   * ISO 8601 timestamp indicating when the implementation process was
   * completed.
   *
   * Marks the exact moment when the Realize agent finished generating all
   * implementation code, completed the compilation validation process, and
   * ensured integration with all previously generated artifacts. This timestamp
   * represents the completion of the entire vibe coding pipeline from
   * requirements to working software.
   */
  completed_at: string & tags.Format<"date-time">;
}
