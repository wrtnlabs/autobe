import { AutoBeTestScenario } from "../histories";
import { AutoBeOpenApi } from "../openapi";
import { AutoBeTest } from "../test/AutoBeTest";

/**
 * Configuration interface for generating complete E2E test function code from
 * validated test scenarios and AST structures.
 *
 * This interface defines the comprehensive input parameters required for
 * transforming validated test scenarios and AST structures into
 * production-ready TypeScript E2E test function code. The code generation
 * process combines business scenario context, API specification compliance, and
 * structured AST representations to produce executable test functions that
 * accurately validate backend implementation quality.
 *
 * The writing process synthesizes multiple information sources to generate
 * complete test functions that maintain business logic accuracy, API
 * integration consistency, and comprehensive validation coverage while
 * following established testing conventions and code quality standards.
 *
 * This interface enables the final transformation from structured test
 * representations into executable TypeScript code that can be immediately
 * compiled and executed as part of comprehensive backend validation workflows.
 *
 * @author Samchon
 */
export interface IAutoBeTestWriteProps {
  /**
   * Complete OpenAPI document specification providing API context and
   * integration requirements for test code generation.
   *
   * Contains the comprehensive {@link AutoBeOpenApi.IDocument} AST structure
   * that defines all available API endpoints, operation specifications,
   * request/response schemas, and business logic contracts. This document
   * serves as the authoritative reference for generating accurate API
   * integration code within the test function implementation.
   *
   * The document enables the code generation process to:
   *
   * - Generate correct SDK function calls with proper parameter structures
   * - Produce accurate type annotations based on API response schemas
   * - Include appropriate error handling for API operation failures
   * - Ensure request body structures conform to defined schema requirements
   * - Generate proper authentication and session management code sequences
   * - Create realistic test data that matches API validation constraints
   *
   * The API document provides essential context for generating test code that
   * accurately reflects the target API surface area and will integrate
   * seamlessly with the actual backend implementation without runtime
   * integration failures.
   */
  document: AutoBeOpenApi.IDocument;

  /**
   * Test scenario metadata containing business context and implementation
   * guidance for code generation.
   *
   * Contains the {@link AutoBeTestScenario} structure that provides the business
   * scenario description, implementation strategy, dependency information, and
   * contextual metadata necessary for generating appropriate test function
   * code. This scenario information guides the code generation process to
   * ensure the resulting test function accurately represents the intended
   * business workflow.
   *
   * The scenario provides crucial context for:
   *
   * - Understanding the business purpose and scope of the test function
   * - Implementing proper dependency sequences and data flow patterns
   * - Generating meaningful variable names and documentation comments
   * - Ensuring test logic aligns with intended business validation objectives
   * - Creating appropriate error handling and edge case coverage
   * - Maintaining consistency with established testing patterns and conventions
   *
   * The scenario metadata ensures that generated code maintains clear business
   * context and implements the intended validation logic while following
   * established naming conventions and documentation standards that facilitate
   * test maintenance and debugging.
   */
  scenario: AutoBeTestScenario;

  /**
   * Validated E2E test function AST structure ready for code generation and
   * TypeScript output.
   *
   * Contains the complete {@link AutoBeTest.IFunction} AST representation that
   * has undergone validation and verification for structural integrity, API
   * compliance, and business logic accuracy. This AST serves as the definitive
   * blueprint for generating the final TypeScript test function
   * implementation.
   *
   * The AST structure provides:
   *
   * **Complete Implementation Blueprint**:
   *
   * - Strategic plan explaining the test implementation approach
   * - Draft TypeScript code representing the intended function structure
   * - Structured statement sequence defining the complete test workflow
   * - Validated expression hierarchies ensuring type safety and correctness
   *
   * **Code Generation Guidance**:
   *
   * - API operation statements with proper endpoint and parameter specifications
   * - Validation predicates with business-appropriate assertions and error
   *   messages
   * - Random data generation patterns producing realistic test values
   * - Control flow structures implementing complex business logic scenarios
   * - Variable references and data flow patterns ensuring proper dependency
   *   management
   *
   * **Quality Assurance Foundation**:
   *
   * - Verified compliance with AutoBeTest interface specifications
   * - Validated integration patterns with API specifications from the document
   * - Confirmed business logic accuracy based on scenario requirements
   * - Established error handling and edge case coverage appropriate for the
   *   business context
   *
   * The AST structure enables deterministic code generation that produces
   * consistent, high-quality TypeScript test functions ready for immediate
   * compilation and execution without manual intervention or debugging
   * requirements.
   */
  function: AutoBeTest.IFunction;

  /**
   * Optional flag indicating whether to apply code formatting to the generated
   * TypeScript output.
   *
   * When true, applies Prettier formatting rules to the generated test function
   * code to ensure consistent code style, proper indentation, line breaks, and
   * spacing that aligns with established TypeScript and testing conventions.
   * When false or undefined, generates functional code without additional
   * formatting, which may be appropriate for performance-sensitive scenarios or
   * when formatting will be applied separately.
   *
   * Code formatting ensures:
   *
   * - Consistent indentation and line breaking for enhanced readability
   * - Proper spacing around operators, function calls, and object literals
   * - Standardized formatting of complex expressions and nested structures
   * - Professional code appearance suitable for production test suites
   * - Alignment with established team coding standards and conventions
   *
   * **Performance Considerations**: Formatting adds processing overhead, so
   * this option allows optimization for scenarios where multiple test functions
   * are generated in batch operations or where formatting will be applied as a
   * separate post-processing step.
   *
   * **Quality Benefits**: Formatted code improves maintainability, debugging
   * ease, and team collaboration by ensuring consistent visual structure that
   * facilitates code review and modification processes.
   *
   * @default false
   */
  prettier?: boolean;
}
