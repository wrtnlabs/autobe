import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";

/**
 * Random number generator for decimal/floating-point values.
 *
 * Generates random decimal values within specified ranges and constraints.
 * Essential for business data like prices, percentages, measurements, and
 * calculated values used in API operations and business validations.
 *
 * E2E testing scenarios:
 *
 * - Product prices and costs for API operation parameters
 * - Percentage values and rates for business calculations
 * - /** Prefix unary expression for operators applied before operands.
 *
 * Represents unary operators that appear before their operands:
 *
 * - "!" for logical negation
 * - "++" for pre-increment
 * - "--" for pre-decrement
 *
 * E2E testing usage:
 *
 * - Logical negation for condition inversion in business logic
 * - Increment/decrement for counter operations (rare in typical test scenarios)
 *
 * **Note**: Operations should be on captured data orimport { AutoBeOpenApi }
 * from "../openapi/AutoBeOpenApi";
 *
 * /** AST type system for programmatic E2E test function generation through AI
 * function calling.
 *
 * This namespace defines a comprehensive Abstract Syntax Tree structure that
 * enables AI agents to construct complete E2E test functions at the AST level.
 * Each type corresponds to specific TypeScript language constructs, allowing
 * precise control over generated test code while maintaining type safety and
 * business logic accuracy.
 *
 * ## Core Purpose
 *
 * The system is designed for systematic generation where AI function calls
 * build test scenarios step-by-step, mapping business requirements to
 * executable code. Instead of generating raw TypeScript strings, AI agents
 * construct structured AST objects that represent:
 *
 * - Complete test function flows with proper data dependencies
 * - Realistic API call sequences with captured responses
 * - Comprehensive validation using TestValidator assertions
 * - Complex business logic with conditional flows and error handling
 *
 * ## Architecture Overview
 *
 * - **IFunction**: Root container representing complete test functions
 * - **Statements**: Building blocks for test logic (declarations, expressions,
 *   conditionals)
 * - **Expressions**: Value computations, API calls, data access, and validations
 * - **Literals**: Direct values for realistic business data
 * - **Random Generators**: Dynamic test data creation with business constraints
 * - **Predicates**: TestValidator assertions for comprehensive validation
 *
 * ## Business Context
 *
 * In E2E testing, this typically maps to complete business scenarios like:
 *
 * - Customer purchase workflows (registration → product selection → payment →
 *   confirmation)
 * - Seller product management (authentication → product creation → inventory
 *   management)
 * - Multi-role interactions (seller creates product → customer purchases → admin
 *   processes)
 *
 * Each generated function represents a realistic business workflow with proper
 * data flow, where API responses from earlier steps provide inputs for
 * subsequent operations, creating authentic test scenarios that mirror
 * real-world application usage.
 *
 * @author Samchon
 */
export namespace AutoBeTest {
  /**
   * Root interface representing a complete E2E test function.
   *
   * This serves as the top-level container for all statements that comprise a
   * test function. Each statement in the array represents a logical step in the
   * test scenario, enabling systematic construction of complex business
   * workflows through AI function calling.
   *
   * The generation process follows a three-stage approach: planning, drafting,
   * and AST construction. This ensures that AI agents create well-structured,
   * comprehensive test functions through deliberate design phases.
   *
   * In the context of E2E testing, this typically maps to complete business
   * scenarios like "customer purchase flow" or "seller product management",
   * where each statement handles one aspect of the workflow.
   *
   * @example
   *   ```typescript
   *   // Generated function represents:
   *   export async function test_api_customer_purchase_flow(
   *     connection: api.IConnection
   *   ): Promise<void> {
   *     // Create seller account and verify
   *     const seller: ISeller = await api.functional.sellers.join(connection, {
   *       email: "seller@example.com",
   *       name: "Test Seller",
   *       password: "secure123"
   *     });
   *     TestValidator.equals("Seller creation")(
   *       "seller@example.com",
   *       seller.email
   *     );
   *
   *     // Create product with business validation
   *     const product: IProduct = await api.functional.products.create(connection, {
   *       sellerId: seller.id,
   *       name: "Premium Headphones",
   *       price: 299.99,
   *       category: "electronics"
   *     });
   *     TestValidator.equals("Product should belong to seller")(
   *       seller.id,
   *       product.sellerId
   *     );
   *
   *     // Customer registration and purchase
   *     const customer: ICustomer = await api.functional.customers.join(connection, {
   *       email: "customer@example.com",
   *       name: "John Doe"
   *     });
   *
   *     // Conditional logic based on business rules
   *     if (customer.verified) {
   *       const order: IOrder = await api.functional.orders.create(connection, {
   *         customerId: customer.id,
   *         items: [{ productId: product.id, quantity: 1 }]
   *       });
   *       TestValidator.equals("Order total should match product price")(
   *         product.price,
   *         order.total
   *       );
   *     }
   *
   *     // Error case validation
   *     await TestValidator.error("Should reject invalid payment")(() =>
   *       api.functional.orders.payment(connection, {
   *         orderId: "invalid-id",
   *         amount: -100
   *       })
   *     );
   *   }
   *   ```;
   */
  export interface IFunction {
    /**
     * Strategic plan for implementing the test scenario.
     *
     * This field requires AI agents to think through the test implementation
     * strategy before generating actual statements. It should analyze the given
     * scenario and determine the optimal approach for creating a comprehensive
     * test function.
     *
     * The plan should address:
     *
     * - Key business entities and their relationships that need to be tested
     * - Sequence of operations required to achieve the test scenario
     * - Data dependencies between different test steps
     * - Validation points where business rules should be verified
     * - Error conditions and edge cases that should be tested
     * - Overall test structure and organization
     *
     * This planning step ensures that the generated statements follow a logical
     * progression and create a realistic, comprehensive test scenario that
     * properly validates the business workflow.
     */
    plan: string;

    /**
     * Draft TypeScript code implementation of the test function.
     *
     * This field contains a preliminary TypeScript implementation of the test
     * function based on the strategic plan. The draft serves as an intermediate
     * step between planning and AST construction, allowing AI agents to:
     *
     * - Visualize the actual code structure before AST generation
     * - Ensure proper TypeScript syntax and API usage patterns
     * - Validate the logical flow and data dependencies
     * - Identify any missing components or validation steps
     * - Refine the approach before committing to AST statements
     *
     * The draft should be complete, executable TypeScript code that represents
     * the full test function implementation. This code will then be analyzed
     * and converted into the corresponding AST statements structure.
     *
     * Example format:
     *
     * ```typescript
     * export async function test_scenario_name(connection: api.IConnection): Promise<void> {
     *   // Implementation based on the plan above
     *   const entity = await api.functional.entities.create(connection, { ... });
     *   TestValidator.equals("validation description")(expected, actual);
     *   // ... more implementation
     * }
     * ```
     */
    draft: string;

    /**
     * Array of statements that comprise the test function body.
     *
     * Each statement represents a discrete step in the test scenario, typically
     * corresponding to business actions like API calls, validations, or state
     * transitions. The order is significant as it reflects the logical flow of
     * the business process.
     *
     * These statements should be generated by analyzing and converting the
     * draft TypeScript code into structured AST representations, ensuring that
     * the implementation follows the predetermined approach and creates a
     * complete data flow chain representing the business scenario.
     *
     * AI function calling strategy: Build statements by parsing the draft code
     * and converting each logical operation into appropriate AST statement
     * types, maintaining the data dependencies and business logic flow
     * established in the draft.
     */
    statements: IStatement[];
  }

  /* -----------------------------------------------------------
    STATEMENTS
  ----------------------------------------------------------- */
  /**
   * Union type representing all possible statement types in test functions.
   *
   * Statements are the building blocks of test function logic, each serving
   * specific purposes in the E2E testing context:
   *
   * - IApiOperateStatement: Primary mechanism for all SDK API operations with
   *   automatic response handling
   * - IVariableDeclaration: Capture computed values and transformations (NOT for
   *   API calls)
   * - IExpressionStatement: Execute utility functions and validations without
   *   value capture
   * - IIfStatement: Handle conditional business logic (prefer predicates for
   *   validation)
   * - IReturnStatement: Function termination (rarely used in tests)
   * - IThrowStatement: Explicit error scenarios
   *
   * Note: IBlockStatement is intentionally excluded from this union as it
   * should only be used in special contexts (like if/else branches) rather than
   * as a general statement type in the main function flow.
   *
   * AI selection strategy: Choose statement type based on the business action
   * being performed. Use IApiOperateStatement for all API operations,
   * predicates for validations, and other statement types for specific non-API
   * needs.
   */
  export type IStatement =
    | IApiOperateStatement
    | IExpressionStatement
    | IIfStatement
    | IVariableDeclaration
    | IReturnStatement
    | IThrowStatement;

  /**
   * Block for grouping statements in specific structural contexts.
   *
   * **SPECIAL USE ONLY**: This type represents a block of statements and should
   * only be used in specific contexts where statement grouping is structurally
   * required:
   *
   * - If/else statement branches
   *
   *   - {@link IIfStatement.thenStatement}
   *   - {@link IIfStatement.elseStatement}
   * - Arrow function bodies: {@link IArrowFunction.body}
   * - Other contexts requiring explicit block scoping
   *
   * Unlike a block statement, this is not a statement itself but a structural
   * container for statements. For normal test function flow, use individual
   * statements directly rather than wrapping them in blocks.
   *
   * **Updated for API-first workflow**: Blocks can now contain
   * `IApiOperateStatement` for API operations, predicate expressions for
   * validations, and other statement types as needed within conditional logic
   * or function bodies.
   *
   * AI function calling restriction: Do not use for general statement grouping
   * in main function flow. Reserve for structural requirements only
   * (conditional branches, function bodies).
   */
  export interface IBlock extends IStatementBase<"block"> {
    /**
     * Nested statements within this block.
     *
     * Each statement represents a step within the grouped operation. Can
     * include any valid statement type:
     *
     * - `IApiOperateStatement` for API operations within conditional logic
     * - Predicate expressions for validations within blocks
     * - `IVariableDeclaration` for computed values within conditional branches
     * - Other statement types as needed for the block's purpose
     *
     * Maintains the same ordering significance as the root function's
     * statements array.
     *
     * Example business context - Block: "Premium Customer Workflow"
     *
     * - API operation: Verify premium status
     * - API operation: Access exclusive content
     * - Predicate: Validate premium features are available
     * - API operation: Log premium usage
     */
    statements: IStatement[];
  }

  /**
   * API operation statement for SDK function calls with automatic response
   * handling.
   *
   * This statement type handles the complete lifecycle of API operations
   * including:
   *
   * 1. Executing API function calls through the SDK
   * 2. Optionally capturing the response in a variable (when variableName is
   *    provided)
   * 3. Performing runtime type assertion using typia.assert<T>() for type safety
   *
   * This is the primary mechanism for all API interactions in E2E test
   * scenarios, replacing the need to use IVariableDeclaration or
   * ICallExpression for API calls.
   *
   * The statement automatically handles the complex pattern of API calling,
   * response capturing, and type validation that is essential for robust E2E
   * testing.
   *
   * AI function calling importance: Use this for ALL SDK API operations to
   * ensure proper response handling and type safety in business test
   * scenarios.
   */
  export interface IApiOperateStatement
    extends IStatementBase<"apiOperateStatement"> {
    /**
     * API endpoint specification defining the operation to be called.
     *
     * Contains the HTTP method and path information that identifies which
     * specific API operation from the OpenAPI specification should be invoked.
     * This corresponds to operations defined in the AutoBeOpenApi.IDocument.
     *
     * The endpoint determines the expected parameter types, request body
     * schema, and response body schema for proper type validation.
     */
    endpoint: AutoBeOpenApi.IEndpoint;

    /**
     * Single argument object for the API function call.
     *
     * **CRITICAL**: All API functions accept exactly one object parameter that
     * contains all necessary data for the operation. This argument object is
     * constructed based on the API operation's specification and follows a
     * standardized structure.
     *
     * **Object Structure Rules:**
     *
     * The argument object is constructed by combining path parameters and
     * request body data according to the following rules based on the target
     * {@link AutoBeOpenApi.IOperation}:
     *
     * 1. **Path Parameters**: Each parameter from
     *    `AutoBeOpenApi.IOperation.parameters` becomes a property in the
     *    argument object, where:
     *
     *    - Property name: `AutoBeOpenApi.IParameter.name`
     *    - Property value: Expression matching `AutoBeOpenApi.IParameter.schema`
     *    - Example: `{ saleId: "uuid-string", customerId: "another-uuid" }`
     * 2. **Request Body**: If `AutoBeOpenApi.IOperation.requestBody` exists:
     *
     *    - Add a `body` property containing the request body data
     *    - Value type: Object literal matching the requestBody's typeName schema
     *    - Example: `{ body: { name: "Product Name", price: 99.99 } }`
     * 3. **Combined Structure**: When both path parameters and request body exist:
     *
     *    ```typescript
     *    {
     *      // Path parameters as individual properties
     *      "saleId": "uuid-value",
     *      "customerId": "another-uuid",
     *      // Request body as 'body' property
     *      "body": {
     *        "name": "Updated Product",
     *        "price": 149.99,
     *        "description": "Enhanced product description"
     *      }
     *    }
     *    ```
     *
     * **Special Cases:**
     *
     * - **No Parameters**: When `parameters` is empty array AND `requestBody` is
     *   null, set this to `null` (the API function requires no arguments)
     * - **Only Path Parameters**: When `requestBody` is null but `parameters`
     *   exist, create object with only path parameter properties
     * - **Only Request Body**: When `parameters` is empty but `requestBody`
     *   exists, create object with only the `body` property
     *
     * **AI Construction Strategy:**
     *
     * 1. Analyze the target `AutoBeOpenApi.IOperation` specification
     * 2. Extract all path parameters and create corresponding object properties
     * 3. If request body exists, add it as the `body` property
     * 4. Ensure all property values match the expected types from OpenAPI schema
     * 5. Use realistic business data that reflects actual API usage patterns
     *
     * **Type Safety Requirements:**
     *
     * - Path parameter values must match their schema types (string, integer,
     *   etc.)
     * - Request body structure must exactly match the referenced schema type
     * - All required properties must be included with valid values
     * - Optional properties can be omitted or included based on test scenario
     *   needs
     *
     * **Business Context Examples:**
     *
     * ```typescript
     * // GET /customers/{customerId}/orders/{orderId} (no request body)
     * {
     *   customerId: "cust-123",
     *   orderId: "order-456"
     * }
     *
     * // POST /customers (only request body)
     * {
     *   body: {
     *     name: "John Doe",
     *     email: "john@example.com",
     *     phone: "+1-555-0123"
     *   }
     * }
     *
     * // PUT /customers/{customerId}/orders/{orderId} (both path params and body)
     * {
     *   customerId: "cust-123",
     *   orderId: "order-456",
     *   body: {
     *     status: "shipped",
     *     trackingNumber: "TRACK123",
     *     estimatedDelivery: "2024-12-25"
     *   }
     * }
     *
     * // GET /health (no parameters or body)
     * null
     * ```
     */
    argument: IObjectLiteral | null;

    /**
     * Optional variable name for capturing the API response.
     *
     * **Conditional Usage:**
     *
     * - `string`: When API operation returns data that needs to be captured
     *
     *   - Creates: `const variableName = typia.assert<ResponseType>(await
     *       api.operation(...))`
     *   - The response is automatically type-validated using typia.assert
     *   - Variable can be referenced in subsequent test steps
     * - `null`: When API operation returns void or response is not needed
     *
     *   - Creates: `await api.operation(...)`
     *   - No variable assignment or type assertion is performed
     *   - Typically used for operations like delete, logout, or fire-and-forget
     *       calls
     *
     * **AI Decision Logic:**
     *
     * - Set to meaningful variable name when the response contains business data
     * - Set to null when the operation is void or side-effect only
     * - Consider if subsequent test steps need to reference the response data
     *
     * Variable naming should follow business domain conventions (e.g.,
     * "customer", "order", "product") rather than technical naming.
     */
    variableName: string | null;
  }

  /**
   * Expression statement for executing utility operations without value
   * capture.
   *
   * **IMPORTANT: For API operations, use `IApiOperateStatement` instead.** This
   * statement type is primarily for utility operations that don't require
   * capturing return values, and where the operation's side effect or
   * validation is more important than its return value.
   *
   * Common E2E testing scenarios:
   *
   * - Validation assertions using TestValidator predicates (when not using
   *   predicate expressions)
   * - Utility function calls (console.log, debugging functions)
   * - Non-API side-effect operations
   * - Cleanup operations that don't involve API calls
   *
   * **Note**: For most validation cases, prefer using predicate expressions
   * (IEqualPredicate, IConditionalPredicate, etc.) instead of expression
   * statements with TestValidator calls.
   *
   * AI function calling usage: Select when the business action's execution is
   * the goal, not data capture, and when the operation is NOT an API call.
   */
  export interface IExpressionStatement
    extends IStatementBase<"expressionStatement"> {
    /**
     * The expression to be executed as a statement.
     *
     * **Should NOT contain API function calls** - use `IApiOperateStatement`
     * for those instead.
     *
     * Typically represents utility operations:
     *
     * - TestValidator function calls (though predicates are preferred)
     * - Console operations for debugging
     * - Non-API utility function invocations
     * - Side-effect operations that don't involve the API
     *
     * The expression's result is discarded, making this suitable for
     * void-returning operations or when return values are not needed for
     * subsequent test steps.
     *
     * Most commonly contains ICallExpression for utility invocations.
     */
    expression: IExpression;
  }

  /**
   * Conditional statement for business rule-based test flow control.
   *
   * Enables test scenarios to branch based on runtime conditions or business
   * rules. This should be used for genuine business logic branching where
   * different test paths are needed based on data state or business
   * conditions.
   *
   * **IMPORTANT: For validation purposes, prefer predicate expressions
   * instead:**
   *
   * - Use `IEqualPredicate` instead of `if (x === y) throw new Error(...)`
   * - Use `INotEqualPredicate` instead of `if (x !== y) throw new Error(...)`
   * - Use `IConditionalPredicate` instead of `if (!condition) throw new
   *   Error(...)`
   * - Use `IErrorPredicate` instead of `if` blocks that only contain error
   *   throwing
   *
   * **Only use IIfStatement when:**
   *
   * - Different business logic paths are needed (not just validation)
   * - Complex conditional workflows that can't be expressed as simple predicates
   * - Role-based or feature-flag dependent test scenarios
   * - Multi-step conditional operations where predicates are insufficient
   *
   * Business scenarios requiring conditional logic:
   *
   * - Role-based test flows (premium vs regular customers)
   * - Feature availability testing with different user journeys
   * - Optional business process steps based on entity state
   * - Complex workflow branching that involves multiple operations per branch
   *
   * AI function calling strategy: First consider if the validation can be
   * handled by predicate expressions. Use IIfStatement only when genuine
   * business logic branching is required that cannot be expressed through
   * predicates.
   */
  export interface IIfStatement extends IStatementBase<"ifStatement"> {
    /**
     * Boolean expression determining which branch to execute.
     *
     * Typically evaluates business conditions like user roles, feature flags,
     * data states, or validation results. Should represent meaningful business
     * logic rather than arbitrary technical conditions.
     *
     * Examples:
     *
     * - Customer.role === "premium"
     * - Product.status === "available"
     * - Order.payment_status === "completed"
     */
    condition: IExpression;

    /**
     * Block to execute when condition is true.
     *
     * Contains the primary business flow for the conditional scenario. Should
     * represent the main path or expected behavior when the business condition
     * is met.
     */
    thenStatement: IBlock;

    /**
     * Optional alternative block for when condition is false.
     *
     * Can be another IIfStatement for chained conditions (else-if) or IBlock
     * for alternative business flow. May be null when no alternative action is
     * needed.
     *
     * Business context: Represents fallback behavior, alternative user
     * journeys, or error handling paths.
     */
    elseStatement: IBlock | IIfStatement | null;
  }

  /**
   * Variable declaration for capturing and storing non-API data.
   *
   * The cornerstone of data flow in E2E test scenarios for non-API operations.
   * Each declaration typically captures computed values, transformations, or
   * references to existing data that will be used in subsequent test steps.
   *
   * **IMPORTANT: For API function calls, use `IApiOperateStatement` instead.**
   * This type should only be used for:
   *
   * - Capturing computed values or transformations
   * - Storing intermediate calculation results
   * - Declaring variables with literal values or non-API expressions
   * - Referencing data from previous API calls
   *
   * Critical for E2E testing because:
   *
   * - Maintains data relationships between test steps
   * - Enables realistic business scenario simulation
   * - Provides type safety through schema validation
   * - Supports complex multi-step workflows
   *
   * AI function calling importance: This is the primary mechanism for building
   * data dependencies between business operations, but should not be used for
   * direct API function calls.
   */
  export interface IVariableDeclaration
    extends IStatementBase<"variableDeclaration"> {
    /**
     * Variable identifier name for subsequent references.
     *
     * Should use meaningful business domain names that clearly indicate the
     * entity or data being captured. Follows camelCase convention and should
     * reflect the business context rather than technical details.
     *
     * Examples:
     *
     * - "seller" (for captured seller account)
     * - "product" (for created product)
     * - "customerOrder" (for placed order)
     * - "paymentResult" (for payment response)
     *
     * AI naming strategy: Use business entity names that clearly indicate what
     * the variable represents in the test scenario.
     */
    name: string;

    /**
     * Complete type schema definition from OpenAPI specifications.
     *
     * References the exact type structure expected from API responses, ensuring
     * type safety and validation. Must correspond to actual DTO types defined
     * in the system's OpenAPI schema.
     *
     * This enables:
     *
     * - Runtime type validation
     * - IDE support and auto-completion
     * - Compile-time error detection
     * - Accurate business data modeling
     *
     * AI function calling requirement: Must match the exact schema of the API
     * operation being called to ensure type consistency.
     */
    schema: AutoBeOpenApi.IJsonSchema;

    /**
     * Variable mutability specification.
     *
     * **STRONGLY PREFER `const` for immutable declarations:**
     *
     * - "const": For immutable values (RECOMMENDED - use by default)
     * - "let": For values that need reassignment (use only when necessary)
     *
     * E2E testing context: Most captured data should be "const" since they
     * represent business entities and API responses that shouldn't change. Use
     * "let" only when the test scenario specifically requires variable
     * reassignment within the test flow.
     *
     * AI decision rule: Always default to "const" unless the test scenario
     * explicitly requires variable reassignment. Reassignment should be rare in
     * well-structured test scenarios.
     */
    mutability: "const" | "let";

    /**
     * Initial value expression for the variable.
     *
     * The expression that provides the initial value for this variable. Should
     * NOT be API function calls - use `IApiOperateStatement` for those
     * instead.
     *
     * Common patterns:
     *
     * - Literal values for test data
     * - Property access from previous variables
     * - Computed expressions from existing data
     * - Object/array construction from captured entities
     *
     * AI expression selection: Ensure this represents data transformation or
     * referencing rather than direct API calls.
     */
    initializer: IExpression;
  }

  /**
   * Return statement for function termination.
   *
   * Rarely used in E2E test functions since they typically return void. May be
   * used in helper functions or when test functions need to return specific
   * data for chaining or validation purposes.
   *
   * **Note**: Most E2E test functions should complete naturally without
   * explicit return statements, as they represent complete business workflow
   * testing rather than value-returning operations.
   *
   * AI function calling usage: Generally avoid in main test functions. Consider
   * only for special cases where test result data needs to be returned to
   * calling context, such as helper functions within arrow function
   * expressions.
   */
  export interface IReturnStatement extends IStatementBase<"returnStatement"> {
    /**
     * Expression representing the value to be returned.
     *
     * Should evaluate to the appropriate return type expected by the function
     * signature. In test contexts, typically void or validation result
     * objects.
     *
     * Can reference previously captured data from API operations or computed
     * values, but should not contain direct API calls.
     */
    value: IExpression;
  }

  /**
   * Explicit error throwing for test failure scenarios.
   *
   * Used for custom error conditions or when specific business rule violations
   * should cause immediate test termination with descriptive error messages.
   *
   * **IMPORTANT: For most validation scenarios, prefer predicate expressions:**
   *
   * - Use `IEqualPredicate` instead of manual equality checks with throw
   * - Use `IConditionalPredicate` instead of condition checks with throw
   * - Use `IErrorPredicate` for testing expected error conditions
   *
   * **Only use IThrowStatement when:**
   *
   * - Custom error handling logic that can't be expressed as predicates
   * - Complex business rule violations requiring custom error messages
   * - Exceptional cases where predicate expressions are insufficient
   *
   * E2E testing scenarios:
   *
   * - Custom validation failures with specific business context
   * - Unexpected state conditions that should halt test execution
   * - Complex error conditions requiring detailed diagnostic information
   *
   * AI function calling usage: Use sparingly, primarily for business logic
   * violations that require explicit error reporting and cannot be handled by
   * the standard predicate validation system.
   */
  export interface IThrowStatement extends IStatementBase<"throwStatement"> {
    /**
     * Expression that evaluates to the error to be thrown.
     *
     * Typically an Error object construction with descriptive message
     * explaining the business context of the failure. Should provide clear
     * information about what business condition caused the error.
     *
     * Should NOT involve API calls - use IApiOperateStatement for API
     * operations that are expected to throw errors, and IErrorPredicate for
     * testing expected API error conditions.
     *
     * Example: new Error("Customer verification failed: invalid email format")
     */
    expression: IExpression;
  }

  /**
   * @internal Base interface for type discrimination in statement union types.
   *
   * Provides the foundational structure for all statement types in the AST.
   * Each concrete statement implementation extends this interface with their
   * specific type discriminator value.
   */
  interface IStatementBase<Type extends string> {
    /** Discriminator type for identifying the statement type. */
    type: Type;
  }

  /* -----------------------------------------------------------
    THE EXPRESSION
  ----------------------------------------------------------- */
  /**
   * Union type encompassing all possible expressions in test scenarios.
   *
   * Expressions represent values, computations, and operations that can be used
   * within statements. This comprehensive set covers all necessary constructs
   * for building complex E2E test scenarios:
   *
   * **Basic constructs:**
   *
   * - Identifiers: Variable references
   * - Property/Element access: Object navigation
   * - Function calls: Utility invocations (NOT API calls - use
   *   IApiOperateStatement)
   * - Literals: Direct values
   *
   * **Advanced constructs:**
   *
   * - Random generators: Test data creation
   * - Operators: Logical and arithmetic operations
   * - Arrow functions: Callback definitions
   * - Predicates: TestValidator validation operations (preferred over manual
   *   validation)
   *
   * **Note**: API function calls should NOT be represented as expressions. Use
   * `IApiOperateStatement` for all SDK API operations instead.
   *
   * AI selection strategy: Choose expression type based on the specific
   * operation needed in the business scenario. For API calls, always use the
   * dedicated statement type rather than call expressions.
   */
  export type IExpression =
    | IIdentifier
    | IPropertyAccessExpression
    | IElementAccessExpression
    | IArrowFunction
    | ICallExpression
    | INewExpression
    | IPrefixUnaryExpression
    | IPostfixUnaryExpression
    | IBinaryExpression
    | IArrayFilterExpression
    | IArrayForEachExpression
    | IArrayMapExpression
    | IArrayRepeatExpression
    | IBooleanLiteral
    | INumericLiteral
    | IStringLiteral
    | IArrayLiteral
    | IObjectLiteral
    | INullLiteral
    | IUndefinedKeyword
    | IPickRandom
    | ISampleRandom
    | IBooleanRandom
    | IIntegerRandom
    | INumberRandom
    | IStringRandom
    | IPatternRandom
    | IFormatRandom
    | IKeywordRandom
    | IEqualPredicate
    | INotEqualPredicate
    | IConditionalPredicate
    | IErrorPredicate;

  /**
   * @internal Base interface for type discrimination in expression union types.
   *
   * Provides the foundational structure for all expression types in the AST.
   * Each concrete expression implementation extends this interface with their
   * specific type discriminator value.
   */
  interface IExpressionBase<Type extends string> {
    /** Discriminator type for identifying the expression type. */
    type: Type;
  }

  /* -----------------------------------------------------------
    ACCESSORS
  ----------------------------------------------------------- */
  /**
   * Identifier expression for referencing variables and utility functions.
   *
   * Represents references to previously declared variables, imported utility
   * functions, or global identifiers. Essential for data flow in test scenarios
   * where values from earlier steps are used in later operations.
   *
   * **IMPORTANT**: Should NOT reference API functions directly. API operations
   * should use `IApiOperateStatement` instead.
   *
   * Common E2E testing usage:
   *
   * - Referencing captured data from previous API operations
   * - Accessing utility function namespaces (e.g., "TestValidator")
   * - Using validation utilities (e.g., "typia")
   * - Referencing business entities from previous steps
   * - Accessing non-API SDK utilities
   *
   * AI function calling context: Use when referencing any named entity in the
   * test scope, excluding direct API function references which should use
   * dedicated statement types.
   */
  export interface IIdentifier extends IExpressionBase<"identifier"> {
    /**
     * The identifier name being referenced.
     *
     * Must correspond to a valid identifier in the current scope:
     *
     * - Previously declared variable names (from IApiOperateStatement or
     *   IVariableDeclaration)
     * - Imported utility function/module names (TestValidator, typia)
     * - Global utility names
     * - Parameter names from function scope
     *
     * **Should NOT** reference API functions directly (e.g., avoid
     * "api.functional.customers.create"). Use IApiOperateStatement for API
     * operations instead.
     *
     * Examples:
     *
     * - "seller" (previously captured from API operation)
     * - "product" (previously captured from API operation)
     * - "TestValidator" (validation utility)
     * - "typia" (type assertion utility)
     * - "connection" (function parameter)
     *
     * AI naming consistency: Must match exactly with variable names from
     * previous IApiOperateStatement.variableName or IVariableDeclaration.name.
     */
    text: string;
  }

  /**
   * Property access expression for object member navigation.
   *
   * Enables access to properties of objects, which is fundamental for
   * navigating captured data from API operations, utility namespaces, and
   * business entity relationships in E2E test scenarios.
   *
   * **IMPORTANT**: Should NOT be used to construct API function calls. Use
   * `IApiOperateStatement` for all API operations instead.
   *
   * Critical E2E testing patterns:
   *
   * - Accessing properties of captured API response data (customer.id,
   *   order.status)
   * - Navigating utility function namespaces (TestValidator.equals, typia.assert)
   * - Extracting business data for subsequent operations
   * - Optional chaining for safe property access
   *
   * AI function calling usage: Essential for building dot-notation chains for
   * data access and utility function calls, but NOT for API operations which
   * have their own dedicated statement type.
   */
  export interface IPropertyAccessExpression
    extends IExpressionBase<"propertyAccessExpression"> {
    /**
     * The base expression being accessed.
     *
     * Typically an IIdentifier for the root object, but can be another property
     * access expression for chained access. Represents the object whose
     * property is being accessed.
     *
     * **Should NOT** represent API namespace access (e.g., avoid
     * "api.functional"). Use IApiOperateStatement for API operations instead.
     *
     * Examples:
     *
     * - IIdentifier("TestValidator") for TestValidator.equals
     * - IIdentifier("customer") for customer.id (where customer was captured via
     *   IApiOperateStatement)
     * - IIdentifier("typia") for typia.assert
     * - Previous property access for deeper chains in captured data
     */
    expression: IExpression;

    /**
     * Whether to use optional chaining (?.) operator.
     *
     * True: Uses ?. for safe property access (property may not exist) False:
     * Uses . for standard property access (property expected to exist)
     *
     * E2E testing context: Use optional chaining when accessing properties that
     * might not exist based on business conditions or API variations.
     *
     * AI decision rule: Use true for optional business data, false for
     * guaranteed response structures and utility function paths.
     */
    questionDot: boolean;

    /**
     * The property name being accessed.
     *
     * Must be a valid property name on the base expression's type. Should
     * correspond to actual properties defined in DTO schemas or utility
     * function names.
     *
     * **Should NOT** represent API endpoint paths. Use IApiOperateStatement for
     * API operations instead.
     *
     * Examples:
     *
     * - "id" (for entity identifiers from captured API data)
     * - "equals" (for TestValidator.equals utility function)
     * - "assert" (for typia.assert utility function)
     * - "status" (for business state properties from API responses)
     *
     * AI validation requirement: Ensure property exists on the base
     * expression's type according to schema definitions, excluding API paths.
     */
    name: string;
  }

  /**
   * Element access expression for dynamic property access and array indexing.
   *
   * Enables access to object properties using computed keys or array elements
   * using indices. Useful for dynamic property access based on runtime values
   * or when property names are not valid identifiers.
   *
   * **Primary use cases in E2E testing:**
   *
   * - Array element access from captured API response data (order.items[0])
   * - Dynamic property access with string keys from API responses
   * - Accessing properties with special characters from captured data
   * - Computed property access based on test data
   *
   * **Note**: This should NOT be used for API function calls. Use
   * `IApiOperateStatement` for all API operations instead.
   *
   * AI function calling context: Use when property access requires computation
   * or when accessing array elements by index in captured data.
   */
  export interface IElementAccessExpression
    extends IExpressionBase<"elementAccessExpression"> {
    /**
     * The base expression being indexed/accessed.
     *
     * Can be any expression that evaluates to an object or array. Typically
     * represents collections or objects from captured API responses with
     * dynamic properties.
     *
     * Should reference previously captured data from API operations rather than
     * direct API calls.
     */
    expression: IExpression;

    /**
     * Whether to use optional chaining (?.[]) operator.
     *
     * True: Uses ?.[] for safe element access False: Uses [] for standard
     * element access
     *
     * Use optional chaining when the base expression might be null/undefined or
     * when the accessed element might not exist in the captured data.
     */
    questionDot: boolean;

    /**
     * Expression that evaluates to the property key or array index.
     *
     * For arrays: typically INumericLiteral for index access For objects:
     * typically IStringLiteral for property key Can be any expression that
     * evaluates to a valid key type
     *
     * Examples:
     *
     * - INumericLiteral(0) for first array element
     * - IStringLiteral("id") for property access
     * - IIdentifier("index") for variable-based access
     */
    argumentExpression: IExpression;
  }

  /* -----------------------------------------------------------
    FUNCTIONAL
  ----------------------------------------------------------- */
  /**
   * Arrow function expression for callback definitions.
   *
   * Used primarily for callback functions required by certain utility functions
   * or specialized operations. In E2E testing, commonly needed for array
   * operations, error handling callbacks, or random data generation functions.
   *
   * **IMPORTANT**: Should NOT contain direct API function calls in the body. If
   * API operations are needed within the function, use `IApiOperateStatement`
   * within the function body.
   *
   * E2E testing scenarios:
   *
   * - Callback functions for IErrorPredicate (testing expected API errors)
   * - Generator functions for IArrayRepeatExpression (creating test data arrays)
   * - Filter/transform functions for captured data manipulation
   * - Event handler functions for specialized testing scenarios
   *
   * AI function calling usage: Generate when utility operations require
   * function parameters or when data transformation callbacks are needed within
   * the test flow.
   */
  export interface IArrowFunction extends IExpressionBase<"arrowFunction"> {
    /**
     * The function body containing the function's logic.
     *
     * Contains the statements that comprise the function's implementation. In
     * test contexts, typically contains simple operations like data
     * transformation, validation, or utility calls.
     *
     * Can include IApiOperateStatement for API operations within the callback,
     * though this should be used judiciously and only when the callback
     * specifically requires API interactions.
     *
     * Should represent meaningful business logic rather than arbitrary
     * computational operations.
     */
    body: IBlock;
  }

  /**
   * Function call expression for non-API function invocations and utility
   * calls.
   *
   * **IMPORTANT: For API function calls, use `IApiOperateStatement` instead.**
   * This type should only be used for:
   *
   * - Validation functions (TestValidator.equals, TestValidator.error)
   * - Utility functions (typia.assert, typia.is)
   * - Helper functions and transformations
   * - Built-in JavaScript functions
   * - Non-API library function calls
   *
   * Essential for E2E testing for utility operations, but API calls should use
   * the dedicated `IApiOperateStatement` for proper handling of business
   * operations and response capturing.
   *
   * AI function calling importance: This represents utility and validation
   * operations in test scenarios, but should NOT be used for SDK API calls
   * which have their own dedicated statement type.
   */
  export interface ICallExpression extends IExpressionBase<"callExpression"> {
    /**
     * Expression representing the function to be called.
     *
     * **Should NOT represent API/SDK functions** - use `IApiOperateStatement`
     * for those instead.
     *
     * Typically represents utility functions:
     *
     * - TestValidator.equals, TestValidator.error
     * - Typia.assert, typia.is
     * - Built-in functions (Array.from, Object.keys, etc.)
     * - Helper/transformation functions
     *
     * Can also be a simple identifier for direct function references.
     *
     * AI requirement: Must NOT resolve to SDK API functions. Those should use
     * the dedicated API function call statement type.
     */
    expression: IExpression;

    /**
     * Array of argument expressions passed to the function.
     *
     * Each argument must match the expected parameter type of the called
     * function. Order and types must correspond exactly to the function
     * signature defined in utility or validation documentation.
     *
     * Common patterns:
     *
     * - Validation parameters for TestValidator calls
     * - Type assertion parameters for typia calls
     * - Transformation parameters for utility functions
     *
     * AI validation: Ensure argument types and count match the target
     * function's signature exactly, excluding API functions.
     */
    arguments: IExpression[];
  }

  /**
   * New expression for object instantiation.
   *
   * Creates new instances of objects, primarily used for:
   *
   * - Error object creation for throw statements
   * - Date object creation for timestamp values
   * - Custom object instantiation when required by utility functions
   *
   * **Note**: Should NOT be used for API-related object creation. API
   * operations that create business entities should use `IApiOperateStatement`
   * instead.
   *
   * E2E testing context: Most commonly used for creating Error objects in throw
   * statements or Date objects for time-sensitive test data. Also used for
   * instantiating utility objects that don't involve API calls.
   *
   * AI function calling usage: Use when business logic requires explicit object
   * instantiation rather than literal values, excluding API-related entity
   * creation.
   */
  export interface INewExpression extends IExpressionBase<"newExpression"> {
    /**
     * Expression representing the constructor function.
     *
     * Typically an identifier for built-in constructors:
     *
     * - "Error" for error objects
     * - "Date" for date objects
     * - Custom class identifiers when needed for utility purposes
     *
     * Should NOT represent API-related constructors or entity builders.
     */
    expression: IExpression;

    /**
     * Arguments passed to the constructor.
     *
     * Must match the constructor's parameter signature. For Error objects:
     * typically string message For Date objects: typically string or number
     * timestamp For other constructors: appropriate parameter types
     *
     * Arguments should be derived from captured data, literals, or
     * computations, not from direct API calls.
     */
    arguments: IExpression[];
  }

  /**
   * Conditional expression for inline value selection.
   *
   * Represents the ternary operator (condition ? trueValue : falseValue) for
   * inline conditional value selection. Useful when values need to be chosen
   * based on business conditions within expressions.
   *
   * **Note**: For complex conditional logic involving API operations, consider
   * using `IIfStatement` with `IApiOperateStatement` instead.
   *
   * E2E testing scenarios:
   *
   * - Conditional parameter values based on captured test data
   * - Dynamic value selection based on business rules from API responses
   * - Fallback value specification for optional data
   * - Simple conditional logic within expression contexts
   *
   * AI function calling context: Use when business logic requires different
   * values based on runtime conditions within expressions, where the conditions
   * and values don't involve direct API calls.
   */
  export interface IConditionalExpression
    extends IExpressionBase<"conditionalExpression"> {
    /**
     * Boolean condition determining which value to select.
     *
     * Should represent meaningful business logic conditions based on captured
     * data rather than arbitrary technical conditions. Can reference data
     * captured from previous API operations.
     */
    condition: IExpression;

    /**
     * Expression evaluated and returned when condition is true.
     *
     * Represents the primary or expected value for the business scenario. Can
     * reference captured API data or computed values.
     */
    whenTrue: IExpression;

    /**
     * Expression evaluated and returned when condition is false.
     *
     * Represents the alternative or fallback value for the business scenario.
     * Can reference captured API data or computed values.
     */
    whenFalse: IExpression;
  }

  /**
   * Prefix unary expression for operators applied before operands.
   *
   * Represents unary operators that appear before their operands:
   *
   * - "!" for logical negation
   * - "++" for pre-increment
   * - "--" for pre-decrement
   *
   * E2E testing usage:
   *
   * - Logical negation for condition inversion in business logic
   * - Increment/decrement for counter operations (rare in typical test scenarios)
   *
   * **Note**: Operations should be on captured data or computed values, not on
   * direct API call results. Use `IApiOperateStatement` for API operations.
   *
   * AI function calling context: Use for simple unary operations needed in
   * business logic conditions or calculations involving captured test data.
   */
  export interface IPrefixUnaryExpression
    extends IExpressionBase<"prefixUnaryExpression"> {
    /**
     * The unary operator to apply.
     *
     * - "!": Logical NOT (most common in test conditions)
     * - "++": Pre-increment (modify then use value)
     * - "--": Pre-decrement (modify then use value)
     */
    operator: "!" | "++" | "--";

    /**
     * The operand expression to which the operator is applied.
     *
     * For "!": typically boolean expressions or conditions involving captured
     * data For "++/--": typically variable identifiers that need modification
     *
     * Should reference captured data or computed values, not direct API calls.
     */
    operand: IExpression;
  }

  /**
   * Postfix unary expression for operators applied after operands.
   *
   * Represents unary operators that appear after their operands:
   *
   * - "++" for post-increment
   * - "--" for post-decrement
   *
   * E2E testing usage:
   *
   * - Counter operations where original value is used before modification
   * - Loop iteration variables (though rare in typical E2E test scenarios)
   *
   * **Note**: Operations should be on captured data or computed values, not on
   * direct API call results. Use `IApiOperateStatement` for API operations.
   *
   * AI function calling context: Use when the original value is needed before
   * the increment/decrement operation, typically in scenarios involving
   * iteration or counting with captured test data.
   */
  export interface IPostfixUnaryExpression
    extends IExpressionBase<"postfixUnaryExpression"> {
    /**
     * The unary operator to apply.
     *
     * - "++": Post-increment (use value then modify)
     * - "--": Post-decrement (use value then modify)
     */
    operator: "++" | "--";

    /**
     * The operand expression to which the operator is applied.
     *
     * Typically variable identifiers that need modification. Should reference
     * captured data or computed values, not direct API call results.
     */
    operand: IExpression;
  }

  /**
   * Binary expression for operations between two operands.
   *
   * Represents all binary operations including comparison, arithmetic, and
   * logical operations. Essential for implementing business logic conditions,
   * calculations, and validations in test scenarios using captured data.
   *
   * **Important**: Both operands should typically reference captured data from
   * API operations, computed values, or literals. For API operations
   * themselves, use `IApiOperateStatement` instead.
   *
   * E2E testing importance: Critical for implementing business rule
   * validations, data comparisons, and conditional logic that reflects
   * real-world application behavior using data captured from API responses.
   */
  export interface IBinaryExpression
    extends IExpressionBase<"binaryExpression"> {
    /**
     * Left operand of the binary operation.
     *
     * Typically represents the primary value being compared or operated upon.
     * In business contexts, often represents actual values from captured API
     * responses or business entities from previous operations.
     */
    left: IExpression;

    /**
     * Binary operator defining the operation type.
     *
     * **Comparison operators:**
     *
     * - "===", "!==": Strict equality/inequality (preferred for type safety)
     * - "<", "<=", ">", ">=": Numerical/string comparisons
     *
     * **Arithmetic operators:**
     *
     * - "+", "-", "*", "/", "%": Mathematical operations
     *
     * **Logical operators:**
     *
     * - "&&": Logical AND (both conditions must be true)
     * - "||": Logical OR (either condition can be true)
     *
     * AI selection guide: Use === for equality checks, logical operators for
     * combining business conditions, arithmetic for calculations on captured
     * data.
     */
    operator:
      | "==="
      | "!=="
      | "<"
      | "<="
      | ">"
      | ">="
      | "+"
      | "-"
      | "*"
      | "/"
      | "%"
      | "&&"
      | "||";

    /**
     * Right operand of the binary operation.
     *
     * Represents the comparison value, second operand in calculations, or
     * second condition in logical operations. In business contexts, often
     * represents expected values, business rule thresholds, or additional
     * captured data from API responses.
     */
    right: IExpression;
  }

  /**
   * Array filter expression for selecting elements that meet criteria.
   *
   * Filters array elements based on a predicate function, keeping only elements
   * that satisfy the specified condition. Essential for extracting subsets of
   * business data from captured API responses or test collections based on
   * business rules and conditions.
   *
   * E2E testing scenarios:
   *
   * - Filtering products by category or price range from API response arrays
   * - Selecting active users from captured user lists for business operations
   * - Finding orders with specific status from API response collections
   * - Extracting eligible items for business rule validation
   *
   * **Primary usage**: Processing captured data from API operations to create
   * focused datasets for subsequent operations or validations.
   *
   * AI function calling strategy: Use when business logic requires working with
   * specific subsets of data captured from API responses, especially for
   * conditional operations or validation scenarios.
   */
  export interface IArrayFilterExpression
    extends IExpressionBase<"arrayFilterExpression"> {
    /**
     * Array expression to be filtered.
     *
     * Should evaluate to an array containing business entities or data captured
     * from API operations. Can reference variables from previous API calls,
     * array literals, or other expressions that produce arrays.
     *
     * Examples:
     *
     * - Reference to captured product array from API response
     * - Array of user entities from previous API operations
     * - Collection of business data for processing
     */
    expression: IExpression;

    /**
     * Arrow function defining the filter criteria.
     *
     * Called for each array element to determine if it should be included in
     * the filtered result. Should return a boolean expression that evaluates
     * business conditions relevant to the filtering purpose.
     *
     * The function parameter represents the current array element being
     * evaluated and can be used to access properties for business logic
     * conditions.
     */
    function: IArrowFunction;
  }

  /**
   * Array forEach expression for iterating over elements with side effects.
   *
   * Executes a function for each array element without returning a new array.
   * Used for performing operations on each element such as validation, logging,
   * or side-effect operations that don't require collecting results.
   *
   * E2E testing scenarios:
   *
   * - Validating each product in a collection meets business requirements
   * - Logging details of each order for debugging test scenarios
   * - Performing individual validations on user entities from API responses
   * - Executing side-effect operations on captured business data
   *
   * **Note**: Use when you need to process each element but don't need to
   * transform or collect results. For transformations, use
   * IArrayMapExpression.
   *
   * AI function calling strategy: Use for validation operations or side effects
   * on each element of captured data collections, especially when the operation
   * doesn't produce a new collection.
   */
  export interface IArrayForEachExpression
    extends IExpressionBase<"arrayForEachExpression"> {
    /**
     * Array expression to iterate over.
     *
     * Should evaluate to an array containing business entities or data that
     * requires individual processing. Often references collections captured
     * from API operations or constructed arrays for testing.
     *
     * Examples:
     *
     * - Array of customers from API response requiring individual validation
     * - Collection of orders needing status verification
     * - List of products requiring individual business rule checks
     */
    expression: IExpression;

    /**
     * Arrow function executed for each array element.
     *
     * Called once for each element in the array. Should contain operations that
     * process the individual element, such as validation calls, logging
     * operations, or other side effects relevant to the business scenario.
     *
     * The function parameter represents the current array element and can be
     * used to access properties and perform element-specific operations.
     */
    function: IArrowFunction;
  }

  /**
   * Array map expression for transforming elements into new values.
   *
   * Transforms each array element using a function, producing a new array with
   * the transformed values. Essential for data transformation, extraction of
   * specific properties, and converting between data formats in business
   * scenarios.
   *
   * E2E testing scenarios:
   *
   * - Extracting IDs from captured entity arrays for subsequent API operations
   * - Transforming product data for different API request formats
   * - Converting user objects to summary data for business validations
   * - Creating parameter arrays from captured business entities
   *
   * **Primary usage**: Data transformation when you need to convert captured
   * API response data into formats suitable for subsequent operations or when
   * extracting specific information from business entities.
   *
   * AI function calling strategy: Use when business logic requires transforming
   * collections of captured data into different formats, especially for
   * preparing data for subsequent API operations.
   */
  export interface IArrayMapExpression
    extends IExpressionBase<"arrayMapExpression"> {
    /**
     * Array expression to be transformed.
     *
     * Should evaluate to an array containing business entities or data that
     * needs transformation. Often references collections captured from API
     * operations that require conversion to different formats.
     *
     * Examples:
     *
     * - Array of product entities requiring ID extraction
     * - Collection of users needing transformation to summary format
     * - Business data requiring format conversion for API parameters
     */
    expression: IExpression;

    /**
     * Arrow function defining the transformation logic.
     *
     * Called for each array element to produce the transformed value. Should
     * return an expression that represents the desired transformation of the
     * input element, creating business-appropriate output data.
     *
     * The function parameter represents the current array element being
     * transformed and can be used to access properties and create the
     * transformed result.
     */
    function: IArrowFunction;
  }

  /**
   * Array repeat generator for dynamic test data creation.
   *
   * Generates arrays with specified length by repeating a generator function.
   * Essential for creating realistic test data that simulates collections like
   * product lists, user arrays, or transaction histories for use in API
   * operations.
   *
   * **Primary usage**: Creating dynamic test data for API operation parameters
   * that require arrays, or for generating test scenarios with specific data
   * sizes.
   *
   * E2E testing importance: Enables testing with realistic data volumes and
   * variations that reflect real-world usage patterns, particularly when
   * combined with `IApiOperateStatement` for bulk operations.
   *
   * AI function calling strategy: Use when business scenarios require
   * collections of specific size rather than fixed arrays, especially for API
   * operations that handle multiple entities.
   */
  export interface IArrayRepeatExpression
    extends IExpressionBase<"arrayRepeatExpression"> {
    /**
     * Expression determining the array length.
     *
     * Can be a literal number for fixed length or a random generator for
     * variable length. Should reflect realistic business constraints (e.g.,
     * reasonable product quantities, user list sizes).
     *
     * Examples:
     *
     * - INumericLiteral(5) for exactly 5 elements
     * - IIntegerRandom for variable length within business limits
     *
     * AI consideration: Choose lengths appropriate for the business context
     * (e.g., 1-10 for shopping cart items, 10-100 for product catalogs).
     */
    length: IExpression;

    /**
     * Arrow function for generating individual array elements.
     *
     * Called once for each array element to generate the element value. Should
     * produce business-appropriate data for the array's purpose.
     *
     * The function typically uses random generators to create varied but
     * realistic business entities. Can also reference captured data from
     * previous API operations to create related test data.
     *
     * AI implementation requirement: Generate meaningful business data rather
     * than arbitrary random values. Consider how the generated data will be
     * used in subsequent API operations.
     */
    function: IArrowFunction;
  }

  /* -----------------------------------------------------------
    LITERALS
  ----------------------------------------------------------- */
  /**
   * Boolean literal for true/false values.
   *
   * Represents direct boolean values used in conditions, flags, and business
   * rule specifications. Common in test scenarios for setting feature flags,
   * validation states, and binary business decisions.
   *
   * E2E testing usage:
   *
   * - Feature flags (enabled: true/false)
   * - Business state flags (active, verified, completed)
   * - Validation parameters for API operations
   * - Configuration options for test scenarios
   *
   * **Note**: Often used as arguments in `IApiOperateStatement` for boolean
   * parameters, or in conditional expressions for business logic.
   */
  export interface IBooleanLiteral extends IExpressionBase<"booleanLiteral"> {
    /**
     * The boolean value (true or false).
     *
     * Should represent meaningful business states rather than arbitrary
     * true/false values. Consider the business context when selecting the value
     * based on the intended test scenario.
     */
    value: boolean;
  }

  /**
   * Numeric literal for number values.
   *
   * Represents direct numeric values including integers, decimals, and
   * floating-point numbers. Essential for business data like quantities,
   * prices, scores, and identifiers used in test scenarios.
   *
   * E2E testing scenarios:
   *
   * - Product quantities and prices for API operation parameters
   * - Score values and ratings in business validations
   * - Pagination parameters (page, limit) for API calls
   * - Business thresholds and limits for conditional logic
   * - Mathematical calculations with captured data
   *
   * **Note**: Commonly used as arguments in `IApiOperateStatement` for numeric
   * parameters, or in comparisons with captured API response data.
   */
  export interface INumericLiteral extends IExpressionBase<"numericLiteral"> {
    /**
     * The numeric value.
     *
     * Can be integer or floating-point number. Should represent realistic
     * business values appropriate for the test scenario context (e.g.,
     * reasonable prices, quantities, scores).
     *
     * AI consideration: Use business-appropriate values rather than arbitrary
     * numbers (e.g., 10000 for price instead of 12345.67).
     */
    value: number;
  }

  /**
   * String literal for text values.
   *
   * Represents direct string values including business names, descriptions,
   * identifiers, and formatted data. One of the most commonly used literal
   * types in E2E testing for realistic business data.
   *
   * E2E testing importance: Critical for providing realistic business data that
   * reflects actual user input and system behavior, especially as parameters
   * for API operations and in comparisons with captured response data.
   */
  export interface IStringLiteral extends IExpressionBase<"stringLiteral"> {
    /**
     * The string value.
     *
     * Should contain realistic business data appropriate for the context:
     *
     * - Names: "John Doe", "Acme Corporation"
     * - Emails: "john@example.com"
     * - Descriptions: "High-quality wireless headphones"
     * - Codes: "PROMO2024", "SKU-12345"
     * - Status values: "pending", "approved", "completed"
     *
     * **Usage context**: Commonly used as arguments in `IApiOperateStatement`
     * for string parameters, in predicate validations for expected values, or
     * in conditional expressions for business logic.
     *
     * AI content strategy: Use meaningful, realistic values that reflect actual
     * business scenarios rather than placeholder text like "string" or "test".
     */
    value: string;
  }

  /**
   * Array literal for creating array values directly.
   *
   * Represents direct array construction with explicit elements. Essential for
   * providing list data in test scenarios such as multiple products, user
   * lists, or configuration arrays, particularly as parameters for API
   * operations.
   *
   * E2E testing scenarios:
   *
   * - Product lists for bulk API operations
   * - Tag arrays for categorization in API requests
   * - Multiple item selections for API parameters
   * - Configuration option lists for test setup
   * - Multiple entity references for relationship testing
   *
   * **Note**: Commonly used as arguments in `IApiOperateStatement` when API
   * operations require array parameters, or for constructing test data to be
   * used in business logic.
   *
   * AI function calling usage: Use when business scenarios require explicit
   * list data rather than dynamic array generation from captured API
   * responses.
   */
  export interface IArrayLiteral extends IExpressionBase<"arrayLiteral"> {
    /**
     * Array of expressions representing the array elements.
     *
     * Each element can be any valid expression (literals, identifiers
     * referencing captured data, function calls, etc.). Elements should
     * represent meaningful business data appropriate for the array's purpose.
     *
     * Examples:
     *
     * - [product1, product2, product3] for entity arrays (referencing captured
     *   data)
     * - ["electronics", "gadgets"] for category tags
     * - [{ name: "file1.jpg" }, { name: "file2.jpg" }] for file lists
     * - [seller.id, customer.id] for ID arrays (mixing captured data)
     *
     * AI content strategy: Populate with realistic business data that reflects
     * actual usage patterns, mixing literals and references to captured data as
     * appropriate.
     */
    elements: IExpression[];
  }

  /**
   * Object literal for creating object values directly.
   *
   * Represents direct object construction with explicit properties. The primary
   * mechanism for creating request bodies, configuration objects, and
   * structured data in E2E test scenarios, particularly as parameters for API
   * operations.
   *
   * E2E testing importance: Critical for API request bodies in
   * `IApiOperateStatement` calls and configuration objects that drive business
   * operations.
   */
  export interface IObjectLiteral extends IExpressionBase<"objectLiteral"> {
    /**
     * Array of property assignments defining the object structure.
     *
     * Each property represents a key-value pair in the object. Properties
     * should correspond to actual DTO structure requirements and business data
     * needs when used as API request bodies.
     *
     * **For API operations**: Must align with API schema requirements when used
     * as arguments in `IApiOperateStatement`. Property names and value types
     * should match expected DTO interfaces.
     *
     * **For test data**: Can mix literal values with references to captured
     * data from previous API operations to create realistic business
     * scenarios.
     *
     * Examples:
     *
     * - { name: "John Doe", email: "john@example.com" } for user creation
     * - { productId: product.id, quantity: 2 } mixing captured data with literals
     * - { status: "active", verified: true } for business state objects
     *
     * AI validation requirement: Ensure properties match the target schema
     * definition exactly when used for API operations, including required
     * fields and types.
     */
    properties: IPropertyAssignment[];
  }

  /**
   * Null literal for explicit null values.
   *
   * Represents explicit null values used in business scenarios where absence of
   * data is meaningful. Important for optional fields, cleared states, and
   * explicit "no value" conditions in API operations and business logic.
   *
   * E2E testing scenarios:
   *
   * - Optional relationship fields in API request bodies
   * - Cleared user preferences in business state
   * - Explicit "no selection" states for optional parameters
   * - Default null values for optional business data in API operations
   *
   * AI decision context: Use when business logic specifically requires null
   * rather than undefined or omitted properties, particularly in API request
   * bodies or when comparing with captured API response data.
   */
  export interface INullLiteral extends IExpressionBase<"nullLiteral"> {
    /**
     * Always null value.
     *
     * Type safety ensures this can only be null, providing clear intent for
     * explicit null assignment in business scenarios.
     */
    value: null;
  }

  /**
   * Undefined keyword for explicit undefined values.
   *
   * Represents explicit undefined values used when business logic requires
   * undefined rather than null or omitted properties. Less commonly used than
   * null in typical business scenarios, but necessary for certain API
   * operations or business logic conditions.
   *
   * E2E testing usage:
   *
   * - Explicit undefined state representation in business logic
   * - Clearing previously set values in test scenarios
   * - API parameters that distinguish between null and undefined
   * - Conditional expressions where undefined has specific meaning
   *
   * AI guidance: Prefer null over undefined unless specific business or API
   * requirements dictate undefined usage, or when working with captured data
   * that may contain undefined values.
   */
  export interface IUndefinedKeyword
    extends IExpressionBase<"undefinedKeyword"> {
    /**
     * Always undefined value.
     *
     * Type safety ensures this can only be undefined, providing clear intent
     * for explicit undefined assignment in business scenarios.
     */
    value: undefined;
  }

  /* -----------------------------------------------------------
    RANDOM
  ----------------------------------------------------------- */
  /**
   * Random picker for selecting from predefined options.
   *
   * Randomly selects one element from a provided array or collection. Essential
   * for choosing from predefined business options like categories, statuses, or
   * configuration values, particularly for API operation parameters.
   *
   * E2E testing scenarios:
   *
   * - Random category selection from available options for API calls
   * - Status selection from valid business states for test data
   * - Configuration option selection for API parameters
   * - User role assignment from available roles for test scenarios
   *
   * **Note**: Often used to generate realistic parameters for
   * `IApiOperateStatement` by selecting from valid business values.
   *
   * AI function calling usage: Use when business logic requires selection from
   * a constrained set of valid options that reflect real API constraints.
   */
  export interface IPickRandom extends IExpressionBase<"pickRandom"> {
    /**
     * Expression evaluating to the collection from which to pick.
     *
     * Typically an array literal containing valid business options or an
     * identifier referencing a predefined collection. Can also reference data
     * captured from previous API operations.
     *
     * Examples:
     *
     * - Array of category names: ["electronics", "clothing", "books"]
     * - Array of status values: ["pending", "approved", "rejected"]
     * - Array of configuration options for API parameters
     * - Reference to captured data: availableRoles (from previous API call)
     *
     * AI requirement: Ensure all options in the collection are valid for the
     * business context where the selection will be used, especially if the
     * result will be used in API operations.
     */
    expression: IExpression;
  }

  /**
   * Random sampler for selecting multiple items from a collection.
   *
   * Randomly selects a specified number of elements from a provided collection
   * without duplication. Useful for creating realistic subsets of business data
   * like featured products, selected users, or sample transactions for API
   * operations.
   *
   * E2E testing scenarios:
   *
   * - Selecting featured products from catalog for API parameters
   * - Choosing random users for notification API calls
   * - Sampling transactions for analysis operations
   * - Creating test data subsets for bulk API operations
   *
   * **Usage with APIs**: Often combined with `IApiOperateStatement` to perform
   * operations on multiple randomly selected entities.
   *
   * AI function calling context: Use when business scenarios require multiple
   * selections from a larger set without duplication, particularly for API
   * operations that handle multiple entities.
   */
  export interface ISampleRandom extends IExpressionBase<"sampleRandom"> {
    /**
     * Expression evaluating to the collection from which to sample.
     *
     * Should contain more elements than the count to enable meaningful random
     * selection. Elements should be valid business entities appropriate for the
     * sampling context. Can reference captured data from previous API
     * operations.
     *
     * Examples:
     *
     * - Array of product IDs from captured API response
     * - Collection of user entities from previous API call
     * - Available options from business configuration
     */
    expression: IExpression;

    /**
     * Number of elements to select from the collection.
     *
     * Must be less than or equal to the collection size. Should represent
     * realistic business requirements for the sampling scenario (e.g., 3-5
     * featured products, 10 sample users).
     *
     * AI consideration: Choose counts that make business sense for the specific
     * use case and available collection size, especially when the result will
     * be used in API operations.
     */
    count: number;
  }

  /**
   * Random boolean generator for true/false values with probability control.
   *
   * Generates boolean values with optional probability weighting. Useful for
   * simulating business scenarios with probabilistic outcomes like feature
   * flags, user preferences, or conditional states in API operations.
   *
   * E2E testing scenarios:
   *
   * - Random feature flag states for API parameter variation
   * - User preference simulation in test data
   * - Conditional business logic testing with probabilistic outcomes
   * - Random yes/no decisions for API operation parameters
   *
   * **API usage**: Commonly used as boolean parameters in
   * `IApiOperateStatement` to create varied test scenarios with realistic
   * probability distributions.
   *
   * AI function calling usage: Use when business logic involves probabilistic
   * boolean outcomes rather than deterministic values, especially for creating
   * diverse API operation parameters.
   */
  export interface IBooleanRandom extends IExpressionBase<"booleanRandom"> {
    /**
     * Probability of generating true (0.0 to 1.0).
     *
     * - Null: 50/50 probability (default random boolean)
     * - 0.0: Always false
     * - 1.0: Always true
     * - 0.7: 70% chance of true, 30% chance of false
     *
     * Should reflect realistic business probabilities:
     *
     * - High probability (0.8-0.9) for common positive states
     * - Low probability (0.1-0.2) for rare conditions
     * - Default (null) for balanced scenarios
     *
     * AI probability selection: Choose based on real-world business likelihood
     * of the condition being true, especially when used in API operations.
     */
    probability: number | null;
  }

  /**
   * Random integer generator with business-appropriate constraints.
   *
   * Generates random integer values within specified ranges and constraints.
   * Essential for creating realistic business numeric data like quantities,
   * counts, scores, and identifiers for use in API operations and business
   * logic.
   *
   * E2E testing importance: Provides realistic numeric data that reflects
   * actual business value ranges and constraints, particularly for API
   * operation parameters and validation scenarios.
   */
  export interface IIntegerRandom extends IExpressionBase<"integerRandom"> {
    /**
     * Minimum value (inclusive).
     *
     * - Null: No minimum constraint
     * - Number: Specific minimum value
     *
     * Should reflect business constraints:
     *
     * - 0 for non-negative quantities
     * - 1 for positive-only values
     * - Business-specific minimums for scores, ratings, etc.
     *
     * AI constraint setting: Choose minimums that make business sense for the
     * specific data type being generated, especially when used in API
     * operations.
     */
    minimum: number | null;

    /**
     * Maximum value (inclusive).
     *
     * - Null: No maximum constraint
     * - Number: Specific maximum value
     *
     * Should reflect realistic business limits:
     *
     * - 100 for percentage values
     * - 5 for rating scales
     * - Reasonable inventory quantities for business operations
     * - Business-specific maximums that align with API constraints
     *
     * AI constraint setting: Choose maximums that reflect real-world business
     * limits and system constraints, particularly for API operation
     * parameters.
     */
    maximum: number | null;

    /**
     * Multiple constraint for generated values.
     *
     * - Null: No multiple constraint
     * - Number: Generated value must be multiple of this number
     *
     * Business use cases:
     *
     * - 5 for rating systems (0, 5, 10, 15, ...)
     * - 10 for price increments in business systems
     * - Custom business increment requirements for API parameters
     *
     * AI usage: Apply when business rules require specific value increments,
     * especially for API operations with constrained parameter values.
     */
    multipleOf: number | null;
  }

  /**
   * Random number generator for decimal/floating-point values.
   *
   * Generates random decimal values within specified ranges and constraints.
   * Essential for business data like prices, percentages, measurements, and
   * calculated values used in API operations and business validations.
   *
   * E2E testing scenarios:
   *
   * - Product prices and costs for API operation parameters
   * - Percentage values and rates for business calculations
   * - Measurement data for physical product specifications
   * - Financial calculations and monetary values
   * - Performance metrics and business KPIs
   */
  export interface INumberRandom extends IExpressionBase<"numberRandom"> {
    /**
     * Minimum value (inclusive).
     *
     * - Null: No minimum constraint
     * - Number: Specific minimum value (can be decimal)
     *
     * Business considerations:
     *
     * - 0.0 for non-negative amounts
     * - 0.01 for minimum price values in business systems
     * - Business-specific decimal minimums for API constraints
     *
     * AI constraint setting: Consider business rules for minimum values,
     * especially for monetary and measurement data used in API operations.
     */
    minimum: number | null;

    /**
     * Maximum value (inclusive).
     *
     * - Null: No maximum constraint
     * - Number: Specific maximum value (can be decimal)
     *
     * Business considerations:
     *
     * - 100.0 for percentage values
     * - Realistic price ranges for products in API operations
     * - System limits for calculations and business rules
     *
     * AI constraint setting: Set realistic upper bounds based on business
     * context and system capabilities, especially for API parameter
     * validation.
     */
    maximum: number | null;

    /**
     * Multiple constraint for decimal precision.
     *
     * - Null: No multiple constraint
     * - Number: Generated value must be multiple of this number
     *
     * Business use cases:
     *
     * - 0.01 for currency precision (cents) in financial API operations
     * - 0.5 for half-point rating systems
     * - Custom precision requirements for business calculations
     *
     * AI precision consideration: Match business precision requirements for the
     * specific data type (currency, measurements, etc.) and API constraints.
     */
    multipleOf: number | null;
  }

  /**
   * Random string generator with length constraints.
   *
   * Generates random strings within specified length ranges. Useful for
   * creating variable-length text data like names, descriptions, codes, and
   * identifiers for use in API operations and business logic testing.
   *
   * E2E testing scenarios:
   *
   * - User names and nicknames for API operation parameters
   * - Product descriptions and content for API requests
   * - Generated codes and tokens for business operations
   * - Text content of varying lengths for validation testing
   * - Custom identifiers for business entity creation
   *
   * **API usage**: Commonly used to generate string parameters for
   * `IApiOperateStatement` calls with appropriate length constraints.
   */
  export interface IStringRandom extends IExpressionBase<"stringRandom"> {
    /**
     * Minimum string length.
     *
     * - Null: No minimum length constraint
     * - Number: Minimum number of characters
     *
     * Business considerations:
     *
     * - 3 for minimum usernames in business systems
     * - 8 for minimum passwords for security requirements
     * - 1 for required non-empty fields in API operations
     * - Business-specific minimum requirements for validation
     *
     * AI length setting: Consider business validation rules and user experience
     * requirements for minimum lengths, especially for API parameter
     * constraints.
     */
    minLength: number | null;

    /**
     * Maximum string length.
     *
     * - Null: No maximum length constraint
     * - Number: Maximum number of characters
     *
     * Business considerations:
     *
     * - 255 for typical database field limits
     * - 50 for names and titles in business systems
     * - 1000 for descriptions and content fields
     * - System-specific character limits for API operations
     *
     * AI length setting: Respect database constraints and UI limitations while
     * allowing realistic content length variation for API operations.
     */
    maxLength: number | null;
  }

  /**
   * Pattern-based random string generator.
   *
   * Generates strings matching specific patterns using regular expressions or
   * format strings. Essential for creating data that matches exact business
   * format requirements like codes, identifiers, and structured text for API
   * operations.
   *
   * E2E testing scenarios:
   *
   * - Product SKU generation for API parameters
   * - User ID formats for business system integration
   * - Business code patterns for API operations
   * - Structured identifier creation for entity relationships
   * - Format-specific text generation for validation testing
   *
   * **API integration**: Particularly useful for generating parameters that
   * must match specific format requirements in `IApiOperateStatement` calls.
   *
   * AI pattern usage: Ensure patterns match actual business format requirements
   * and API validation rules.
   */
  export interface IPatternRandom extends IExpressionBase<"patternRandom"> {
    /**
     * Regular expression pattern for string generation.
     *
     * Defines the exact format structure for generated strings. Should match
     * business format requirements and validation patterns used in API
     * operations.
     *
     * Examples:
     *
     * - "SKU-[0-9]{6}" for product SKUs in business systems
     * - "[A-Z]{3}-[0-9]{4}" for order codes in API operations
     * - "[a-z]{5,10}" for username patterns with length constraints
     * - "[A-Z]{2}[0-9]{8}" for business reference numbers
     *
     * AI pattern creation: Ensure patterns generate valid data that passes
     * business validation rules and format requirements used in API calls.
     */
    pattern: string;
  }

  /**
   * Format-based random data generator.
   *
   * Generates data matching specific standardized formats like emails, UUIDs,
   * dates, and URLs. Critical for creating valid business data that conforms to
   * standard formats and validation requirements in API operations.
   *
   * E2E testing importance: Ensures generated data passes format validation and
   * represents realistic business data types, particularly essential for API
   * operation parameters that require specific formats.
   */
  export interface IFormatRandom extends IExpressionBase<"formatRandom"> {
    /**
     * Standardized format specification for data generation.
     *
     * Supports common business data formats essential for API operations:
     *
     * **Security & Encoding:**
     *
     * - "binary": Binary data representation
     * - "byte": Base64 encoded data
     * - "password": Password strings for authentication
     * - "regex": Regular expression patterns
     *
     * **Identifiers:**
     *
     * - "uuid": Universally unique identifiers for entity references
     *
     * **Network & Communication:**
     *
     * - "email": Email addresses for user-related API operations
     * - "hostname": Network hostnames for system integration
     * - "idn-email": Internationalized email addresses
     * - "idn-hostname": Internationalized hostnames
     * - "ipv4": IPv4 addresses for network configuration
     * - "ipv6": IPv6 addresses for network configuration
     *
     * **Web & URI:**
     *
     * - "uri": Uniform Resource Identifiers for API endpoints
     * - "iri": Internationalized Resource Identifiers
     * - "iri-reference": IRI references
     * - "uri-reference": URI references
     * - "uri-template": URI templates
     * - "url": Web URLs for external resource references
     *
     * **Date & Time:**
     *
     * - "date-time": ISO 8601 date-time strings for API timestamps
     * - "date": Date-only strings for business date fields
     * - "time": Time-only strings for scheduling operations
     * - "duration": Time duration strings for business processes
     *
     * **JSON & Pointers:**
     *
     * - "json-pointer": JSON Pointer strings for data navigation
     * - "relative-json-pointer": Relative JSON Pointers
     *
     * AI format selection: Choose formats that match the business context and
     * validation requirements of the target API operation field.
     */
    format:
      | "binary"
      | "byte"
      | "password"
      | "regex"
      | "uuid"
      | "email"
      | "hostname"
      | "idn-email"
      | "idn-hostname"
      | "iri"
      | "iri-reference"
      | "ipv4"
      | "ipv6"
      | "uri"
      | "uri-reference"
      | "uri-template"
      | "url"
      | "date-time"
      | "date"
      | "time"
      | "duration"
      | "json-pointer"
      | "relative-json-pointer";
  }

  /**
   * Domain-specific random data generator.
   *
   * Generates realistic business data for specific domains using predefined
   * generation rules. Provides contextually appropriate data that reflects
   * real-world business scenarios and user behavior for API operations.
   *
   * E2E testing importance: Creates realistic test data that closely mimics
   * actual user input and business content, improving test scenario
   * authenticity and catching real-world edge cases in API operations.
   */
  export interface IKeywordRandom extends IExpressionBase<"keywordRandom"> {
    /**
     * Domain-specific data generation keyword.
     *
     * Predefined generators for common business data types used in API
     * operations:
     *
     * **Text & Content:**
     *
     * - "alphabets": Random alphabetic strings for codes and identifiers
     * - "alphaNumeric": Random alphanumeric strings for mixed-format identifiers
     * - "paragraph": Realistic paragraph text for content fields
     * - "content": Generic content text for description fields
     *
     * **Personal Information:**
     *
     * - "mobile": Mobile phone numbers for contact information in APIs
     * - "name": Personal names (first, last, full) for user-related operations
     *
     * AI domain selection: Choose domains that provide realistic data
     * appropriate for the business context and API field purpose.
     *
     * **Usage strategy for API operations:**
     *
     * - Use "name" for user registration and profile API calls
     * - Use "mobile" for contact information in business APIs
     * - Use "paragraph" for descriptions and content in API requests
     * - Use "content" for general text fields in API parameters
     * - Use "alphabets"/"alphaNumeric" for codes and identifiers in API calls
     */
    keyword:
      | "alphabets"
      | "alphaNumeric"
      | "paragraph"
      | "content"
      | "mobile"
      | "name";
  }

  /**
   * Equality validation predicate for TestValidator assertion.
   *
   * Generates TestValidator.equals() calls to verify that two values are equal.
   * This is the most commonly used validation pattern in E2E tests for
   * confirming API responses match expected values and ensuring data integrity
   * throughout business workflows.
   *
   * **Preferred over manual validation**: Use this instead of `IIfStatement`
   * with throw statements for equality checking.
   *
   * E2E testing scenarios:
   *
   * - Verifying API response data matches expected values
   * - Confirming entity IDs are correctly preserved across API operations
   * - Validating state transitions in business workflows
   * - Ensuring data consistency after CRUD operations via API calls
   *
   * AI function calling usage: Use after API operations (IApiOperateStatement)
   * to validate response data and confirm business logic execution. Essential
   * for maintaining test reliability and catching regressions.
   */
  export interface IEqualPredicate extends IExpressionBase<"equalPredicate"> {
    /**
     * Descriptive title explaining what is being validated.
     *
     * Should clearly describe the business context and expectation being
     * tested. This title appears in test failure messages to help with
     * debugging.
     *
     * Examples:
     *
     * - "Customer ID should match created entity"
     * - "Order status should be confirmed after payment"
     * - "Product price should equal the specified amount"
     * - "Review content should match updated values"
     *
     * AI title strategy: Use business-meaningful descriptions that explain the
     * validation purpose and help developers understand test failures.
     */
    title: string;

    /**
     * Expected value expression (first parameter to TestValidator.equals).
     *
     * Represents the value that should be returned or the expected state after
     * a business operation. Typically literal values or previously captured
     * data from earlier API operations.
     *
     * Common patterns:
     *
     * - String literals for expected names, statuses, or codes
     * - Numeric literals for expected quantities, prices, or scores
     * - Identifiers referencing captured entity IDs or data from API operations
     * - Object literals for expected data structures
     *
     * AI value selection: Choose expected values that reflect realistic
     * business outcomes and match the API response schema.
     */
    x: IExpression;

    /**
     * Actual value expression (second parameter to TestValidator.equals).
     *
     * Represents the actual value returned from API operations or business
     * operations that needs validation. Often property access expressions
     * extracting specific fields from captured API response data.
     *
     * Common patterns:
     *
     * - Property access for API response fields (customer.id, order.status)
     * - Identifiers for captured variables from API operations
     * - Array/object element access for nested data from API responses
     * - Function call results for computed values (excluding API calls)
     *
     * AI expression construction: Ensure the actual value expression extracts
     * the correct data from API responses according to the schema structure.
     */
    y: IExpression;
  }

  /**
   * Inequality validation predicate for TestValidator assertion.
   *
   * Generates TestValidator.equals(false)(typia.is<Type>(value)) calls or
   * similar to verify that values are NOT equal or that a value is NOT of a
   * specific type. Used for negative validations and ensuring values have
   * changed or differ from previous states.
   *
   * **Preferred over manual validation**: Use this instead of `IIfStatement`
   * with throw statements for inequality checking.
   *
   * E2E testing scenarios:
   *
   * - Verifying values have changed after update API operations
   * - Confirming different entities have different identifiers
   * - Ensuring sensitive data is not exposed in API responses
   * - Validating that values are NOT of unexpected types
   *
   * AI function calling usage: Use when business logic requires confirming
   * differences or ensuring values have been modified by API operations.
   * Important for testing update operations and data transformations.
   */
  export interface INotEqualPredicate
    extends IExpressionBase<"notEqualPredicate"> {
    /**
     * Descriptive title explaining what inequality is being validated.
     *
     * Should clearly describe why the values should NOT be equal or what
     * difference is expected. This helps with understanding test intent and
     * debugging failures.
     *
     * Examples:
     *
     * - "Updated product name should differ from original"
     * - "New order ID should not match previous order"
     * - "Modified review should have different content"
     * - "Response should not contain sensitive password data"
     *
     * AI title strategy: Focus on the business reason for the inequality check
     * and what change or difference is being validated.
     */
    title: string;

    /**
     * First value expression for comparison.
     *
     * Typically represents the original value, previous state, or value that
     * should be different from the second expression. Often captured from
     * earlier API operations or represents a baseline state.
     *
     * Common patterns:
     *
     * - Original values before update API operations
     * - Different entity identifiers from API responses
     * - Previous state values captured from earlier API calls
     * - Baseline data for comparison
     */
    x: IExpression;

    /**
     * Second value expression for comparison.
     *
     * Represents the new value, current state, or value that should differ from
     * the first expression. Often the result of API operations or updated data
     * captured from API responses.
     *
     * Common patterns:
     *
     * - Updated values after modification API operations
     * - Current entity states from API responses
     * - New data from API responses
     * - Transformed or processed values
     */
    y: IExpression;
  }

  /**
   * Conditional validation predicate for TestValidator assertion.
   *
   * Generates TestValidator validation calls based on boolean conditions. Used
   * for validating business logic conditions, state checks, and conditional
   * assertions that depend on runtime data or business rules from API
   * responses.
   *
   * **Preferred over manual validation**: Use this instead of `IIfStatement`
   * with throw statements for conditional validation logic.
   *
   * E2E testing scenarios:
   *
   * - Validating business rule compliance using API response data
   * - Checking conditional states (user roles, feature flags) from API calls
   * - Verifying complex boolean logic conditions involving captured data
   * - Ensuring data meets business constraints after API operations
   *
   * AI function calling usage: Use when test validation depends on evaluating
   * business conditions rather than simple equality checks. Essential for
   * testing complex business logic and rule-based systems with API
   * integration.
   */
  export interface IConditionalPredicate
    extends IExpressionBase<"conditionalPredicate"> {
    /**
     * Descriptive title explaining the conditional logic being validated.
     *
     * Should clearly describe the business condition or rule being tested and
     * why it should be true. This helps understand the business context and
     * debug failures when conditions aren't met.
     *
     * Examples:
     *
     * - "Premium customer should have access to exclusive features"
     * - "Order total should exceed minimum purchase amount"
     * - "Product should be available for selected category"
     * - "User should have sufficient permissions for this operation"
     *
     * AI title strategy: Explain the business rule or condition being validated
     * and its importance to the overall business workflow.
     */
    title: string;

    /**
     * Boolean expression representing the condition to be validated.
     *
     * Should evaluate to true when the business condition is met. Can be simple
     * comparisons or complex logical expressions combining multiple business
     * rules and data checks involving captured API response data.
     *
     * Common patterns:
     *
     * - Comparison expressions using captured data (customer.tier === "premium")
     * - Logical combinations (hasPermission && isActive) with API response data
     * - Type checks using typia.is<Type>(capturedValue)
     * - Complex business rule evaluations with captured entities
     *
     * AI condition construction: Build conditions that accurately represent
     * business rules and constraints relevant to the test scenario, using data
     * captured from API operations.
     */
    expression: IExpression;
  }

  /**
   * Error validation predicate for TestValidator assertion.
   *
   * Generates TestValidator.error() or TestValidator.httpError() calls to
   * verify that operations correctly throw errors under specific conditions.
   * Critical for testing error handling, business rule violations, and security
   * constraints in API operations.
   *
   * **Preferred over manual error testing**: Use this instead of `IIfStatement`
   * with throw statements or try-catch blocks for error validation.
   *
   * E2E testing scenarios:
   *
   * - Testing authentication failures with invalid credentials in API calls
   * - Verifying authorization errors for restricted API operations
   * - Confirming validation errors for invalid input data in API requests
   * - Ensuring proper error responses for business rule violations
   *
   * AI function calling usage: Use when business scenarios should intentionally
   * fail to test error handling and system security. Essential for negative
   * testing and ensuring robust API error responses.
   */
  export interface IErrorPredicate extends IExpressionBase<"errorPredicate"> {
    /**
     * Descriptive title explaining the error condition being tested.
     *
     * Should clearly describe what error is expected and why it should occur.
     * This helps understand the negative test case purpose and assists with
     * debugging when expected errors don't occur.
     *
     * Examples:
     *
     * - "Should fail login with invalid email address"
     * - "Should reject order creation without payment method"
     * - "Should return 403 for unauthorized customer access"
     * - "Should validate required fields in registration"
     *
     * AI title strategy: Focus on the specific error condition and business
     * context that should trigger the failure.
     */
    title: string;

    /**
     * Arrow function containing the operation that should throw an error.
     *
     * Encapsulates the API operation or business logic that is expected to
     * fail. The function should contain realistic API operations (using
     * IApiOperateStatement within the function body) with invalid data or
     * unauthorized access attempts that trigger appropriate error responses.
     *
     * **Note**: The function body can contain IApiOperateStatement calls since
     * this is specifically for testing API error conditions.
     *
     * Common patterns:
     *
     * - API calls with invalid authentication credentials
     * - API operations with malformed or missing required data
     * - Unauthorized access attempts to restricted API resources
     * - Business rule violations that should be rejected by API operations
     *
     * AI function construction: Create realistic error scenarios that test
     * actual business constraints and security measures rather than arbitrary
     * technical failures. Focus on API operation error conditions.
     */
    function: IArrowFunction;
  }

  /**
   * Property assignment for object literal construction.
   *
   * Represents individual key-value pairs within object literals. Critical for
   * building request bodies, configuration objects, and structured data that
   * conforms to API schemas and business requirements, particularly for use in
   * `IApiOperateStatement` operations.
   *
   * E2E testing importance: Each property assignment must align with DTO schema
   * requirements to ensure valid API requests and realistic business data
   * representation.
   *
   * AI function calling requirement: Property names and value types must match
   * target schema definitions exactly, especially when used for API operation
   * parameters.
   */
  export interface IPropertyAssignment {
    /**
     * Type discriminator for property assignments.
     *
     * Always "propertyAssignment" to distinguish from other object construction
     * mechanisms in the AST.
     */
    type: "propertyAssignment";

    /**
     * Property name (object key).
     *
     * Must correspond to actual property names defined in target DTO schemas,
     * API specifications, or business data models. Should use camelCase
     * convention matching TypeScript interfaces.
     *
     * **API context**: When used in request bodies for API operations, must
     * exactly match the expected parameter names in the API specification.
     *
     * Examples:
     *
     * - "name" for entity names in API requests
     * - "email" for contact information in API calls
     * - "price" for monetary values in business API operations
     * - "createdAt" for timestamps in API responses
     * - "isActive" for boolean flags in API parameters
     *
     * AI validation requirement: Ensure property names exist in the target
     * schema and follow exact naming conventions used in API specifications.
     */
    name: string;

    /**
     * Property value expression.
     *
     * Expression that evaluates to the property value. Type must match the
     * expected type for this property in the target schema. Should represent
     * realistic business data appropriate for the property's purpose.
     *
     * **API usage**: When used in API operation parameters, must generate
     * values compatible with the API specification requirements.
     *
     * Common patterns:
     *
     * - String literals for names, descriptions, codes in API requests
     * - Numeric literals for quantities, prices, scores in API calls
     * - Boolean literals for flags and states in API parameters
     * - Object literals for nested business data in API requests
     * - Array literals for collections in API operations
     * - Random generators for variable test data in API calls
     * - Identifiers for referencing captured data from previous API operations
     *
     * AI type matching: Must generate expressions that produce values
     * compatible with the target property's schema type and API constraints.
     */
    value: IExpression;
  }
}
