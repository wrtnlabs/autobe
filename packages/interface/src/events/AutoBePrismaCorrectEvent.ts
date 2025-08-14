import { AutoBePrisma } from "../prisma/AutoBePrisma";
import { IAutoBePrismaValidation } from "../prisma/IAutoBePrismaValidation";
import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeTokenUsageEventBase } from "./AutoBeTokenUsageEventBase";

/**
 * Event fired when the Prisma agent corrects validation failures in the
 * database design.
 *
 * This event occurs when the custom Prisma compiler detects validation errors
 * in the constructed AST structure and the Prisma agent receives feedback to
 * correct compilation issues. The correction process represents the
 * sophisticated feedback loop that enables AI self-correction, ensuring that
 * only valid and semantically correct database designs proceed to final
 * generation.
 *
 * The correction mechanism is essential for maintaining the reliability of the
 * vibe coding pipeline, allowing the system to iteratively refine database
 * designs until they meet all validation requirements and business
 * constraints.
 *
 * @author Samchon
 */
export interface AutoBePrismaCorrectEvent
  extends AutoBeEventBase<"prismaCorrect">,
    AutoBeTokenUsageEventBase {
  /**
   * The validation failure details that triggered the correction process.
   *
   * Contains the specific {@link IAutoBePrismaValidation.IFailure} information
   * that describes what validation errors were detected in the database design.
   * This includes details about relationship issues, constraint violations,
   * naming problems, or other semantic errors that prevented successful
   * validation.
   *
   * The failure information provides the diagnostic context necessary for the
   * AI to understand what went wrong and make appropriate corrections to the
   * database design.
   */
  failure: IAutoBePrismaValidation.IFailure;

  /**
   * The corrected AST application structure addressing the validation failures.
   *
   * Contains the revised {@link AutoBePrisma.IApplication} structure that
   * attempts to resolve the validation issues identified in the failure. The
   * correction incorporates the feedback from the validation process to address
   * relationship problems, fix constraint violations, resolve naming conflicts,
   * or correct other structural issues.
   *
   * This corrected structure will undergo validation again to ensure that the
   * modifications successfully resolve the identified problems while
   * maintaining the integrity of the overall database design.
   */
  correction: AutoBePrisma.IApplication;

  /**
   * Explanation of the correction strategy and changes being made.
   *
   * Describes the AI's analysis of the validation failure and the specific
   * approach being taken to resolve the issues. This planning explanation
   * provides transparency into the correction process, helping stakeholders
   * understand what changes are being made and why they are necessary.
   *
   * The planning commentary helps track the iterative improvement process and
   * provides insights into how the AI learns from validation feedback to
   * improve database design quality.
   */
  planning: string;

  /**
   * Iteration number of the requirements analysis this correction was performed
   * for.
   *
   * Indicates which version of the requirements analysis this database
   * correction reflects. This step number ensures that the correction efforts
   * are aligned with the current requirements and helps track the evolution of
   * database design quality as validation feedback is incorporated.
   *
   * The step value enables proper synchronization between correction activities
   * and the underlying requirements, ensuring that design improvements remain
   * relevant to the current project scope and business objectives.
   */
  step: number;
}
