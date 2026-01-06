/**
 * Union type representing the five phases of AutoBE's waterfall development
 * pipeline.
 *
 * This type defines the sequential phases that AutoBE follows to transform
 * natural language requirements into a complete, production-ready backend
 * application. Each phase builds upon the outputs of previous phases, following
 * a structured waterfall model with internal spiral loops for error correction
 * and quality assurance.
 *
 * **The Five Phases**:
 *
 * 1. **analyze**: Requirements Analysis Phase
 *    - Transforms user conversations into structured requirements documents
 *    - Produces comprehensive markdown documentation (2,000-30,000+ characters)
 *    - Defines business model, functional requirements (EARS format), API
 *      guidance, ERD
 *    - Output: `AutoBeAnalyzeHistory` with requirements files
 *
 * 2. **database**: Database Design Phase
 *    - Designs and generates Prisma database schema from requirements
 *    - Organizes tables into domain-driven namespaces/components
 *    - Ensures referential integrity, normalization, and performance
 *    - Output: `AutoBeDatabaseHistory` with Prisma schema models
 *
 * 3. **interface**: API Specification Phase
 *    - Creates OpenAPI specification from requirements and database schema
 *    - Defines endpoints, operations, request/response schemas, authorization
 *    - Ensures type-safe API contract aligned with database
 *    - Output: `AutoBeInterfaceHistory` with OpenAPI document
 *
 * 4. **test**: E2E Test Generation Phase
 *    - Generates comprehensive E2E test suites for all API operations
 *    - Creates test scenarios, test functions, and authorization test setup
 *    - Ensures 100% operation coverage with realistic test data
 *    - Output: `AutoBeTestHistory` with test code files
 *
 * 5. **realize**: Implementation Phase
 *    - Generates actual NestJS controller and service implementation code
 *    - Creates collector functions (data fetching), transformer functions (data
 *      processing)
 *    - Implements authorization decorators, guards, and business logic
 *    - Output: `AutoBeRealizeHistory` with implementation code
 *
 * **Waterfall + Spiral Model**:
 *
 * While phases execute sequentially, each phase contains internal spiral loops
 * where AI agents generate code, compilers validate it, and correction agents
 * fix errors until 100% compilation success is achieved. This combines the
 * structured progress of waterfall with the iterative quality assurance of
 * spiral development.
 *
 * **State Machine Integration**:
 *
 * Each phase maintains a `step` counter that auto-increments when requirements
 * change, triggering automatic invalidation and regeneration of downstream
 * artifacts to maintain consistency across the entire pipeline.
 *
 * @author Samchon
 * @see AutoBeHistory
 * @see AutoBeAnalyzeHistory
 * @see AutoBeDatabaseHistory
 * @see AutoBeInterfaceHistory
 * @see AutoBeTestHistory
 * @see AutoBeRealizeHistory
 */
export type AutoBePhase =
  | "analyze"
  | "database"
  | "interface"
  | "test"
  | "realize";
