import { IAutoBePrismaCompileResult } from "../compiler";
import { AutoBePrisma, IAutoBePrismaValidation } from "../prisma";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Prisma agent completes the database design process and
 * successfully generates validated schema files.
 *
 * This event represents the successful completion of the sophisticated
 * three-tier compiler infrastructure that transforms business requirements into
 * validated database architectures. The completion marks the transition from
 * requirements analysis to a concrete database implementation that maintains
 * perfect semantic integrity and syntactic correctness.
 *
 * The Prisma agent's completion ensures that the database design accurately
 * reflects business needs while providing the foundation for subsequent API
 * development and application implementation phases.
 *
 * @author Samchon
 */
export interface AutoBePrismaCompleteEvent
  extends AutoBeEventBase<"prismaComplete"> {
  /**
   * The validated AST application structure containing the complete database
   * design.
   *
   * Contains the finalized {@link AutoBePrisma.IApplication} structure that
   * represents the complete database architecture as validated AST data. This
   * application includes all models, relationships, constraints, and business
   * rules that have passed through the comprehensive validation process
   * including relationship graph analysis, business logic validation, and
   * performance optimization.
   *
   * The application structure serves as the authoritative source of database
   * design that has been verified for semantic correctness and business
   * alignment before code generation.
   */
  result: IAutoBePrismaValidation;

  /**
   * Generated Prisma schema files as key-value pairs.
   *
   * Contains the production-ready schema files generated through deterministic
   * code generation from the validated AST structure. Each key represents the
   * filename (following the pattern `schema-{number}-{domain}.prisma`) and each
   * value contains the actual Prisma schema content organized by business
   * domains.
   *
   * The schemas include comprehensive documentation, optimal indexes, proper
   * constraints, and all optimizations derived from the AST analysis, ready for
   * immediate deployment to the target database environment.
   */
  schemas: Record<string, string>;

  /**
   * Results of compiling the generated Prisma schema files.
   *
   * Contains the {@link IAutoBePrismaCompileResult} from processing the
   * generated schemas through the Prisma compiler. This should always indicate
   * successful compilation since the schemas are generated from pre-validated
   * AST structures. The compilation results include documentation, diagrams,
   * and dependency files ready for deployment.
   *
   * Successful compilation confirms that the generated schemas will work
   * correctly in the target database environment and integrate properly with
   * the broader development ecosystem.
   */
  compiled: IAutoBePrismaCompileResult;

  /**
   * Iteration number of the requirements analysis this database design was
   * completed for.
   *
   * Indicates which version of the requirements analysis this database design
   * reflects. This step number ensures that the database implementation is
   * aligned with the current requirements and helps track the evolution of data
   * architecture as business requirements change.
   *
   * The step value enables proper synchronization between database design and
   * the underlying requirements, ensuring that subsequent development phases
   * work with the most current and relevant database foundation.
   */
  step: number;
}
