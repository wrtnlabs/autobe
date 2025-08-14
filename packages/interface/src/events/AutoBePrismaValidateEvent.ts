import { IAutoBePrismaCompileResult } from "../compiler/IAutoBePrismaCompileResult";
import { IAutoBePrismaValidation } from "../prisma/IAutoBePrismaValidation";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Prisma agent validates the constructed database design
 * and encounters validation failures that need correction.
 *
 * This event occurs when the custom Prisma compiler processes the generated AST
 * structure and detects validation errors that prevent successful schema
 * compilation. The validation process represents a critical quality gate in the
 * vibe coding pipeline, ensuring that only semantically correct and
 * business-aligned database designs proceed to final generation.
 *
 * The validation event triggers the feedback loop that enables AI
 * self-correction, providing detailed error information that helps the Prisma
 * agent understand what needs to be fixed and how to improve the database
 * design quality.
 *
 * @author Samchon
 */
export interface AutoBePrismaValidateEvent
  extends AutoBeEventBase<"prismaValidate"> {
  /**
   * The validation failure details describing what errors were detected.
   *
   * Contains the specific {@link IAutoBePrismaValidation.IFailure} information
   * that describes the validation errors found in the database design. This
   * includes details about relationship issues, constraint violations, naming
   * problems, performance concerns, or other semantic errors that prevent the
   * design from meeting quality standards.
   *
   * The failure information provides comprehensive diagnostic details necessary
   * for the AI to understand the validation problems and formulate appropriate
   * corrections to resolve the identified issues.
   */
  result: IAutoBePrismaValidation.IFailure;

  /**
   * Results of attempting to compile the current database design.
   *
   * Contains the {@link IAutoBePrismaCompileResult} from the compilation attempt
   * that revealed the validation issues. Even when validation fails, the
   * compiler may provide partial results or additional diagnostic information
   * that helps understand the scope and nature of the problems.
   *
   * The compilation results offer additional context beyond the validation
   * failure, potentially including information about which parts of the design
   * are working correctly and which specific areas need attention.
   */
  compiled: IAutoBePrismaCompileResult;

  /**
   * Generated schema files that failed validation as key-value pairs.
   *
   * Contains the Prisma schema files that were generated but failed to pass
   * validation. Each key represents the filename and each value contains the
   * schema content that contains the validation errors. These schemas provide
   * context for understanding what was attempted and where the problems
   * occurred.
   *
   * Having access to the failing schemas enables detailed analysis of the
   * validation issues and helps in formulating precise corrections that address
   * the specific problems without disrupting working portions of the design.
   */
  schemas: Record<string, string>;

  /**
   * Iteration number of the requirements analysis this validation was performed
   * for.
   *
   * Indicates which version of the requirements analysis this database
   * validation reflects. This step number ensures that the validation feedback
   * is aligned with the current requirements and helps track the quality
   * improvement process as validation issues are identified and resolved.
   *
   * The step value enables proper synchronization between validation activities
   * and the underlying requirements, ensuring that validation efforts remain
   * relevant to the current project scope and business objectives.
   */
  step: number;
}
