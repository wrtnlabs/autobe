import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Prisma agent begins the database design process.
 *
 * This event marks the initiation of the sophisticated three-tier compiler
 * infrastructure that transforms business requirements into validated database
 * architectures through AST manipulation. The Prisma agent start represents the
 * beginning of the foundational data layer development that will support all
 * subsequent application functionality.
 *
 * The database design process that begins with this event will proceed through
 * component organization, schema creation, validation, and compilation to
 * produce production-ready Prisma schemas that maintain perfect semantic
 * integrity and syntactic correctness while accurately reflecting business
 * requirements.
 *
 * @author Samchon
 */
export interface AutoBePrismaStartEvent extends AutoBeEventBase<"prismaStart"> {
  /**
   * Reason why the Prisma agent was activated through function calling.
   *
   * Explains the specific circumstances that triggered the AI chatbot to invoke
   * the Prisma agent via function calling. This could include reasons such as
   * initial database design after requirements analysis completion, updating
   * database schemas due to requirement changes, regenerating data models to
   * reflect modified business logic, or creating additional database structures
   * for new functionality.
   *
   * Understanding the activation reason provides context for the database
   * design scope and helps stakeholders understand whether this represents
   * initial development, schema refinement, or expansion of existing data
   * architecture.
   */
  reason: string;

  /**
   * Iteration number of the requirements analysis this database design is being
   * started for.
   *
   * Indicates which version of the requirements analysis this database design
   * will reflect. This step number ensures that the Prisma agent works with the
   * current requirements and helps track the evolution of database schemas as
   * business requirements and data needs change.
   *
   * The step value enables proper synchronization between database design
   * activities and the underlying requirements, ensuring that the data
   * architecture remains aligned with the current project scope and business
   * objectives throughout the iterative development process.
   */
  step: number;
}
