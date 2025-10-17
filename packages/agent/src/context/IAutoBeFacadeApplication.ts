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
  analyze(): Promise<IAutoBeFacadeApplicationResult>;

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
     * Database design instructions - RAW USER CONTENT ONLY.
     *
     * 🚨 **DO NOT WRITE "Design database according to user specification"** 🚨
     *
     * **PASTE THE ACTUAL SPECIFICATION:**
     *
     * - Every ```prisma block completely with ALL models
     * - Every CREATE TABLE statement entirely
     * - Every column, type, @unique, @index, @relation exactly
     * - Every "DO NOT create" instruction
     * - Every forbidden pattern like "no audit tables", "no subtype tables"
     *
     * **IF USER PROVIDED PRISMA MODELS:** Include ALL lines of ALL models, not
     * a summary. Include ALL fields, relations, indexes, constraints. Include
     * ALL comments and annotations.
     *
     * Focus on database phase ONLY but include COMPLETE schemas, not
     * references. Code blocks are SACRED - include them COMPLETELY.
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
     * API design instructions - RAW USER CONTENT ONLY.
     *
     * 🚨 **INSTRUCTION !== SUMMARY** 🚨
     *
     * **COPY-PASTE EVERYTHING ABOUT APIs:**
     *
     * - Complete OpenAPI/Swagger YAML/JSON blocks if provided
     * - All endpoint paths like /api/v1/members/{id}
     * - All HTTP methods, headers, query params specifications
     * - All DTO structures with validation rules
     * - All error codes and response formats
     *
     * **THE RULE:** User's API specs = 3000 characters? Your instruction = 3000
     * characters User included code blocks? Include the SAME code blocks User
     * wrote in broken English? Keep the broken English
     *
     * Focus on API phase ONLY but NEVER summarize or reference. Always PASTE
     * the actual content.
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
     * Testing strategy instructions - RAW USER CONTENT ONLY.
     *
     * 🚨 **CTRL+C → CTRL+V, NOTHING ELSE** 🚨
     *
     * **INCLUDE EVERYTHING ABOUT TESTING:**
     *
     * - All test scenarios user mentioned
     * - All edge cases and failure conditions
     * - All coverage requirements ("test all CRUD operations")
     * - All validation rules and assertions
     * - All performance test requirements
     *
     * **REMEMBER:** You are not an editor. You are not a summarizer. You are a
     * COPY-PASTE MACHINE. If user wrote test requirements in 20 bullet points,
     * paste those 20 bullet points EXACTLY.
     *
     * Focus on test phase ONLY but include ALL user instructions about testing.
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
     * Implementation instructions - RAW USER CONTENT ONLY.
     *
     * 🚨 **YOU ARE NOT PAID TO THINK, YOU ARE PAID TO COPY-PASTE** 🚨
     *
     * **PASTE ALL IMPLEMENTATION DETAILS:**
     *
     * - All business logic rules and algorithms
     * - All performance requirements ("handle 10K requests/sec")
     * - All caching strategies and optimization notes
     * - All transaction handling requirements
     * - All security and validation logic
     * - All code examples user provided
     *
     * **GOLDEN RULE:** The instruction field is a TEXT BUFFER, not a SUMMARY
     * FIELD. User wrote 100 lines about implementation? Paste 100 lines. User
     * included pseudocode? Paste the pseudocode. User mixed Korean and English?
     * Keep both languages.
     *
     * Focus on implementation phase ONLY but BE A PIPE, NOT A FILTER.
     */
    instruction: string;
  }): Promise<IAutoBeFacadeApplicationResult>;
}
