import { IAutoBeFacadeApplicationResult } from "./IAutoBeFacadeApplicationResult";

/**
 * Application for AutoBE function calling.
 *
 * @author Samchon
 */
export interface IAutoBeFacadeApplication {
  /**
   * Run Analyze Agent.
   *
   * Executes the Analyze agent to process user requirements and generate a
   * structured specification document. This agent analyzes all conversation
   * history between users and AI, separates business logic from technical
   * requirements, and establishes development priorities and scope.
   *
   * **IMPORTANT**: Only call this function when sufficient requirements have
   * been discussed to generate a comprehensive specification. The context must
   * contain enough detail about the system's purpose, core features, data
   * models, and business rules. If requirements are unclear or incomplete,
   * continue gathering information through conversation instead.
   *
   * The agent will automatically generate follow-up questions for any ambiguous
   * requirements and continuously refine its understanding through iterative
   * conversation. When executed after other agents have generated code, it can
   * also interpret change requests in the context of existing implementations.
   */
  analyze(props: {
    /**
     * Requirements-focused instructions extracted verbatim from user utterances.
     *
     * Contains the RAW, UNMODIFIED instructions from the entire conversation
     * history specifically for the requirements analysis phase. Should focus
     * ONLY on features, business rules, user stories, and functional
     * specifications. Must NOT include database design, API patterns, or
     * implementation details which belong to other phases.
     *
     * **CRITICAL**: Copy-paste the user's exact words including:
     * - Complete technical specifications with all code blocks preserved
     * - Original formatting, line breaks, indentation, and markdown
     * - User's tone, emphasis, and any absolute commands
     * - ALL relevant instructions from ANY point in the conversation
     *
     * **NEVER**: Summarize, abbreviate, interpret, or fabricate requirements.
     * When in doubt, include MORE raw content, not less.
     */
    instruction: string;
  }): Promise<IAutoBeFacadeApplicationResult>;

  /**
   * Run prisma agent.
   *
   * Executes the Prisma agent to generate database schema files and ERD
   * documentation. This agent reads the requirements specification created by
   * the {@link analyze Analyze agent} and produces a complete Prisma schema with
   * comprehensive documentation for each entity and attribute.
   *
   * **PREREQUISITE**: Only call this function after the {@link analyze} function
   * has been successfully executed and a requirements specification document
   * has been generated. The Prisma agent depends on the structured requirements
   * analysis to design the database schema properly. Without a completed
   * requirements specification, this function should NOT be called.
   *
   * The agent will automatically validate the generated schema using the Prisma
   * compiler, self-correct any compilation errors through feedback loops, and
   * generate ERD documentation using prisma-markdown. An internal review
   * process ensures schema quality and optimization.
   */
  prisma(props: {
    /**
     * Database design instructions extracted verbatim from user utterances.
     *
     * Contains the RAW, UNMODIFIED instructions from the entire conversation
     * history specifically for the database schema design phase. Should focus
     * ONLY on schema structure, relationships, constraints, and indexing
     * strategies. Must NOT include API design or business logic implementation
     * details.
     *
     * **CRITICAL**: Copy-paste the user's exact words including:
     * - Complete CREATE TABLE statements and schema definitions AS-IS
     * - All column names, types, constraints exactly as specified
     * - Original formatting, SQL code blocks, and comments
     * - User's emphatic rules about forbidden patterns or requirements
     *
     * **NEVER**: Summarize, abbreviate, interpret, or fabricate requirements.
     * Technical specifications are sacred - pass them through untouched.
     */
    instruction: string;
  }): Promise<IAutoBeFacadeApplicationResult>;

  /**
   * Run interface agent.
   *
   * Executes the Interface agent to design and generate API interfaces. This
   * agent creates OpenAPI schemas and TypeScript/NestJS code based on the
   * requirements specification and ERD documentation from previous agents.
   *
   * The agent follows a sophisticated pipeline: first constructing formal
   * OpenAPI Operation Schemas and JSON Schemas, then validating these schemas,
   * and finally transforming them into NestJS controllers and DTOs. Each
   * generated interface includes comprehensive JSDoc comments and undergoes
   * internal review for consistency.
   */
  interface(props: {
    /**
     * API design instructions extracted verbatim from user utterances.
     *
     * Contains the RAW, UNMODIFIED instructions from the entire conversation
     * history specifically for the API interface design phase. Should focus
     * ONLY on endpoint patterns, request/response formats, DTO schemas, and
     * operation specifications. Must NOT include database details or
     * implementation logic.
     *
     * **CRITICAL**: Copy-paste the user's exact words including:
     * - Complete OpenAPI/Swagger specifications if provided
     * - Exact endpoint paths, methods, and parameter names
     * - DTO structures and validation rules as specified
     * - Original formatting and code blocks preserved
     *
     * **NEVER**: Summarize, abbreviate, interpret, or fabricate requirements.
     * Preserve all technical details exactly as provided.
     */
    instruction: string;
  }): Promise<IAutoBeFacadeApplicationResult>;

  /**
   * Run test program agent.
   *
   * Executes the Test agent to generate comprehensive E2E test suites for all
   * {@link interface API interfaces}. This agent synthesizes outputs from
   * previous agents to create tests that validate both individual endpoints and
   * their interactions.
   *
   * **PREREQUISITE**: Only call this function after the {@link interface}
   * function has been successfully executed and API interfaces have been
   * generated. The Test agent requires the completed API interface definitions,
   * OpenAPI schemas, and TypeScript code to generate appropriate test
   * scenarios. Without completed interface design, this function should NOT be
   * called.
   *
   * The agent will analyze dependency relationships between API functions,
   * structure integrated test scenarios with correct execution sequences, and
   * enhance pre-generated test scaffolds with business logic validation.
   * TypeScript compiler validation and internal review ensure test quality and
   * optimal coverage.
   */
  test(props: {
    /**
     * Testing strategy instructions extracted verbatim from user utterances.
     *
     * Contains the RAW, UNMODIFIED instructions from the entire conversation
     * history specifically for the test code generation phase. Should focus
     * ONLY on test scenarios, coverage priorities, edge cases, and validation
     * strategies. Must NOT include implementation or API design details.
     *
     * **CRITICAL**: Copy-paste the user's exact words including:
     * - Specific test cases or scenarios mentioned
     * - Testing priorities and coverage requirements
     * - Edge cases and validation rules
     * - Original wording without interpretation
     *
     * **NEVER**: Summarize, abbreviate, interpret, or fabricate requirements.
     * Include all testing-related instructions from the conversation.
     */
    instruction: string;
  }): Promise<IAutoBeFacadeApplicationResult>;

  /**
   * Run realize agent.
   *
   * Executes the Realize agent to implement the actual business logic for each
   * API endpoint. This agent synthesizes all outputs from previous agents to
   * generate fully functional service provider code.
   *
   * **PREREQUISITE**: Only call this function after the {@link interface}
   * function has been successfully executed and API interfaces have been
   * generated. The Realize agent requires the completed API interface
   * definitions to implement the corresponding service logic. It also benefits
   * from having test code available for validation. Without completed interface
   * design, this function should NOT be called.
   *
   * The agent will create service implementations with multiple validation
   * layers: TypeScript compiler feedback, runtime validation through test
   * execution, and quality optimization through internal review. The generated
   * code handles database interactions through Prisma, implements security and
   * validation checks, and processes business rules according to
   * specifications.
   */
  realize(props: {
    /**
     * Implementation instructions extracted verbatim from user utterances.
     *
     * Contains the RAW, UNMODIFIED instructions from the entire conversation
     * history specifically for the business logic implementation phase. Should
     * focus ONLY on architectural patterns, performance requirements, business
     * logic details, and service layer decisions. Must NOT include database
     * schema or API interface specifications.
     *
     * **CRITICAL**: Copy-paste the user's exact words including:
     * - Specific implementation patterns or code examples
     * - Performance requirements and constraints
     * - Business logic rules and algorithms
     * - Original technical specifications preserved
     *
     * **NEVER**: Summarize, abbreviate, interpret, or fabricate requirements.
     * Pass through all implementation details exactly as stated.
     */
    instruction: string;
  }): Promise<IAutoBeFacadeApplicationResult>;
}
