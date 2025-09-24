import { tags } from "typia";

import { IAutoBeTypeScriptCompileResult } from "../compiler/IAutoBeTypeScriptCompileResult";
import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";
import { AutoBeTestFile } from "./contents/AutoBeTestFile";

/**
 * History record generated when the Test agent writes e2e test code based on
 * the previous requirements analysis, database design, and RESTful API
 * specification.
 *
 * The Test agent conceives multiple use case scenarios for each API endpoint
 * and implements them as test programs. These test programs are composed of one
 * TypeScript file and a standalone function for each scenario, providing
 * comprehensive coverage of the API functionality and business logic
 * validation.
 *
 * When the AI occasionally writes incorrect TypeScript code, the system
 * provides compilation error messages as feedback, allowing the AI to
 * self-correct. This feedback process usually works correctly, so test code
 * written by AI almost always compiles successfully, ensuring robust and
 * reliable test suites.
 *
 * @author Samchon
 */
export interface AutoBeTestHistory extends AutoBeAgentHistoryBase<"test"> {
  /**
   * Collection of generated e2e test files with detailed scenario metadata.
   *
   * Contains an array of test file objects where each file represents a
   * specific testing scenario with its location, content, and associated
   * scenario information. Each test file includes standalone functions that
   * implement particular use case scenarios for API endpoints, providing
   * comprehensive end-to-end testing coverage with rich contextual
   * information.
   *
   * Unlike simple key-value pairs, this structure allows for detailed tracking
   * of test scenarios, their purposes, and their relationships to specific API
   * endpoints and business requirements. The test files are designed to
   * validate both technical functionality and business rule implementation,
   * ensuring that the generated APIs work correctly under realistic operational
   * conditions.
   */
  files: AutoBeTestFile[];

  /**
   * Results of compiling the generated test code using the embedded TypeScript
   * compiler.
   *
   * Contains the compilation outcome of the test files built through the
   * TypeScript compiler. The feedback process usually works correctly, so this
   * should typically indicate successful compilation. However, when using very
   * small AI models, the {@link IAutoBeTypeScriptCompileResult} might have
   * `success := false`.
   *
   * Compilation errors trigger a self-correction feedback loop where the AI
   * receives detailed error messages and attempts to fix the issues
   * automatically.
   */
  compiled: IAutoBeTypeScriptCompileResult;

  /**
   * Instructions for the Test agent redefined by AI from user's utterance.
   *
   * Contains AI-generated specific guidance for the test code generation phase,
   * interpreted and refined from the user's original request. These instructions
   * direct the Test agent on test scenario prioritization, coverage requirements,
   * edge cases to consider, and specific business rules to validate through
   * comprehensive e2e testing.
   */
  instruction: string;

  /**
   * Iteration number of the requirements analysis report this test code was
   * written for.
   *
   * Indicates which version of the requirements analysis this test suite
   * reflects. If this value is lower than {@link AutoBeAnalyzeHistory.step}, it
   * means the test code has not yet been updated to reflect the latest
   * requirements and may need regeneration.
   *
   * A value of 0 indicates the initial test suite, while higher values
   * represent subsequent revisions based on updated requirements, API changes,
   * or database schema modifications.
   */
  step: number;

  /**
   * ISO 8601 timestamp indicating when the test code generation was completed.
   *
   * Marks the exact moment when the Test agent finished writing all test
   * scenarios, completed the compilation validation process, and resolved any
   * compilation errors through the feedback loop. This timestamp is crucial for
   * tracking the development timeline and determining the currency of the test
   * suite relative to other development artifacts.
   */
  completed_at: string & tags.Format<"date-time">;
}
