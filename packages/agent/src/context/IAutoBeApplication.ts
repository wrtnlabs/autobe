import { IAutoBeApplicationProps } from "./IAutoBeApplicationProps";
import { IAutoBeApplicationResult } from "./IAutoBeApplicationResult";

/**
 * Application for AutoBE function calling.
 *
 * @author Samchon
 */
export interface IAutoBeApplication {
  /**
   * Run Analyze Agent.
   *
   * Analyze agent analyzes requirements and creates specification documents.
   *
   * The Analyze agent serves as the foundation of the entire development
   * process. It not only captures initial requirements but also continuously
   * refines understanding through iterative conversation with users. When
   * requirements are ambiguous or incomplete, it proactively formulates
   * targeted questions to elicit necessary information before proceeding with
   * development.
   *
   * Additionally, once other agents have generated code, the Analyze agent can
   * interpret change requests in the context of existing implementations,
   * assessing the impact and feasibility of modifications while maintaining
   * system integrity. This comprehensive approach ensures that all subsequent
   * development stages work from a clear, complete, and consistent
   * specification.
   */
  analyze(props: IAutoBeApplicationProps): Promise<IAutoBeApplicationResult>;

  /**
   * Run prisma agent.
   *
   * Prisma agent analyzes requirements specifications to generate database
   * schemas in Prisma format.
   *
   * The Prisma agent references the requirements specification document created
   * by the {@link analyze} function to craft the `prisma.schema` file. For each
   * entity and attribute in the database schema, it provides comprehensive
   * documentation including the rationale behind its creation, its purpose, and
   * conceptual explanations. The agent employs normalization techniques to
   * ensure high-quality database design.
   *
   * Once the DB schema file is written, the Prisma agent compiles it using the
   * built-in Prisma compiler. If compilation errors occur, these are fed back
   * to the AI agent, enabling a self-correction process through compiler
   * feedback. After successful compilation, this schema file is then subjected
   * to a quality assurance process through an internal review agent that
   * verifies and refines the schema.
   *
   * Note that, never use this function without calling the {@link analyze}
   * function at least once.
   */
  prisma(props: IAutoBeApplicationProps): Promise<IAutoBeApplicationResult>;

  /** Run interface agent. */
  interface(props: IAutoBeApplicationProps): Promise<IAutoBeApplicationResult>;

  /** Run test program agent. */
  test(props: IAutoBeApplicationProps): Promise<IAutoBeApplicationResult>;

  /** Run realize agent. */
  realize(props: IAutoBeApplicationProps): Promise<IAutoBeApplicationResult>;
}
