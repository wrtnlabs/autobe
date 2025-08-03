import { AutoBePrisma } from "../prisma";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired during the review phase of the Prisma database design process.
 *
 * This event occurs when the Prisma agent is reviewing the drafted database
 * schema and making assessments based on best practices, design patterns,
 * and business requirements. The review phase is a critical part of the
 * structured workflow that ensures the database design is optimal before
 * final validation and compilation.
 *
 * The review process involves evaluation of the generated schemas, relationships,
 * constraints, and overall database architecture to identify potential
 * improvements, optimization opportunities, or design issues that should be
 * addressed before finalizing the database implementation.
 *
 * @author Copilot
 */
export interface AutoBePrismaReviewEvent
  extends AutoBeEventBase<"prismaReview"> {
  /**
   * The Prisma application structure being reviewed.
   *
   * Contains the current database design as {@link AutoBePrisma.IApplication}
   * that includes all models, relationships, constraints, and business rules
   * generated from the requirements analysis. This represents the complete
   * database architecture being evaluated for design quality, performance
   * implications, and business alignment.
   *
   * The application structure serves as the foundation for the review process,
   * allowing the reviewer to assess the overall database design and identify
   * areas for improvement or optimization.
   */
  application: AutoBePrisma.IApplication;

  /**
   * Review commentary and assessment of the database design.
   *
   * Contains the agent's detailed evaluation of the current database design,
   * including identified strengths, potential issues, optimization suggestions,
   * or architectural recommendations. This review content provides transparency
   * into the assessment process and reasoning behind any suggested improvements.
   *
   * The review may include analysis of model relationships, index optimization,
   * constraint effectiveness, naming conventions, or overall schema organization
   * to ensure the database design follows best practices and supports the
   * intended business operations efficiently.
   */
  review: string;

  /**
   * Current iteration number of the requirements analysis this database design
   * review is being performed for.
   *
   * Indicates which version of the requirements analysis this database design
   * review reflects. This step number ensures that the database review is
   * aligned with the current requirements and helps track the evolution of
   * database architecture as business requirements change.
   *
   * The step value enables proper synchronization between database design
   * review and the underlying requirements, ensuring that subsequent development
   * phases work with the most current and relevant database foundation.
   */
  step: number;
}