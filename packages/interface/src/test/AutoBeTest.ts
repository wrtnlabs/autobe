import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";

/**
 * AST type system for programmatic E2E test function generation through AI
 * function calling.
 *
 * This namespace defines a comprehensive Abstract Syntax Tree structure that
 * enables AI agents to construct complete E2E test functions at the AST level.
 * Each type corresponds to specific TypeScript language constructs, allowing
 * precise control over generated test code while maintaining type safety and
 * business logic accuracy.
 *
 * The system is designed for systematic generation where AI function calls
 * build test scenarios step-by-step, mapping business requirements to
 * executable code.
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
   * In the context of E2E testing, this typically maps to complete business
   * scenarios like "customer purchase flow" or "seller product management",
   * where each statement handles one aspect of the workflow.
   *
   * @example
   *   // Represents a function like:
   *   // export async function test_api_customer_purchase_flow() {
   *   //   const seller: ISeller = await api.sellers.join(...);     // Statement 1
   *   //   const product: IProduct = await api.products.create(...);  // Statement 2
   *   //   const customer: ICustomer = await api.customers.join(...);  // Statement 3
   *   //   // ... more statements
   *   // }
   */
  export interface IFunction {
    /**
     * Array of statements that comprise the test function body.
     *
     * Each statement represents a discrete step in the test scenario, typically
     * corresponding to business actions like API calls, validations, or state
     * transitions. The order is significant as it reflects the logical flow of
     * the business process.
     *
     * AI function calling strategy: Build statements incrementally, where each
     * statement depends on results from previous statements, creating a
     * complete data flow chain representing the business scenario.
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
   * - IVariableDeclaration: Capture API responses for data flow
   * - IExpressionStatement: Execute API calls and validations
   * - IIfStatement: Handle conditional business logic
   * - IReturnStatement: Function termination (rarely used in tests)
   * - IThrowStatement: Explicit error scenarios
   *
   * Note: IBlockStatement is intentionally excluded from this union as it
   * should only be used in special contexts (like if/else branches) rather than
   * as a general statement type in the main function flow.
   *
   * AI selection strategy: Choose statement type based on the business action
   * being performed and whether data capture is needed.
   */
  export type IStatement =
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
   * Unlike IBlockStatement, this is not a statement itself but a structural
   * container for statements. For normal test function flow, use individual
   * statements directly rather than wrapping them in blocks.
   *
   * AI function calling restriction: Do not use for general statement grouping
   * in main function flow. Reserve for structural requirements only
   * (conditional branches, function bodies).
   */
  export interface IBlock extends IStatementBase<"block"> {
    /**
     * Nested statements within this block.
     *
     * Each statement represents a step within the grouped operation. Maintains
     * the same ordering significance as the root function's statements array.
     *
     * Example business context: Block: "Customer Authentication Setup"
     *
     * - Customer registration
     * - Email verification
     * - Login confirmation
     * - Session validation
     */
    statements: IStatement[];
  }

  /**
   * Expression statement for executing operations without value capture.
   *
   * The primary statement type for API calls that don't require capturing
   * return values, as well as validation operations using TestValidator.
   * Essential for test functions where the operation's side effect is more
   * important than its return value.
   *
   * Common E2E testing scenarios:
   *
   * - Authentication operations (login, logout)
   * - State-changing API calls without needed return data
   * - Validation assertions using TestValidator
   * - Cleanup operations
   *
   * AI function calling usage: Select when the business action's execution is
   * the goal, not data capture for subsequent steps.
   */
  export interface IExpressionStatement
    extends IStatementBase<"expressionStatement"> {
    /**
     * The expression to be executed as a statement.
     *
     * Typically represents API calls, validation calls, or other operations
     * that produce side effects. The expression's result is discarded, making
     * this suitable for void-returning operations or when return values are not
     * needed for subsequent test steps.
     *
     * Most commonly contains ICallExpression for API invocations or
     * TestValidator function calls for assertions.
     */
    expression: IExpression;
  }

  /**
   * Conditional statement for business rule-based test flow control.
   *
   * Enables test scenarios to branch based on runtime conditions or business
   * rules. Critical for testing different user roles, feature flags, or
   * handling optional business flows that depend on data state.
   *
   * Business scenarios requiring conditional logic:
   *
   * - Role-based test flows (premium vs regular customers)
   * - Feature availability testing
   * - Error condition handling and recovery
   * - Optional business process steps
   *
   * AI function calling strategy: Use when business logic requires different
   * test paths based on data conditions or user characteristics.
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
   * Variable declaration for capturing and storing API response data.
   *
   * The cornerstone of data flow in E2E test scenarios. Each declaration
   * typically captures a business entity (customer, order, product, etc.) that
   * will be referenced in subsequent test steps, creating the data chain that
   * represents real-world business workflows.
   *
   * Critical for E2E testing because:
   *
   * - Maintains data relationships between test steps
   * - Enables realistic business scenario simulation
   * - Provides type safety through schema validation
   * - Supports complex multi-step workflows
   *
   * AI function calling importance: This is the primary mechanism for building
   * data dependencies between business operations.
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
     * - "const": For immutable API responses (most common in tests)
     * - "let": For values that may be modified during test execution
     *
     * E2E testing context: Most API responses should be "const" since they
     * represent captured business entities. Use "let" only when the variable
     * needs to be reassigned within the test flow.
     *
     * AI decision rule: Default to "const" unless the test scenario
     * specifically requires variable reassignment.
     */
    mutability: "const" | "let";
  }

  /**
   * Return statement for function termination.
   *
   * Rarely used in E2E test functions since they typically return void. May be
   * used in helper functions or when test functions need to return specific
   * data for chaining or validation purposes.
   *
   * AI function calling usage: Generally avoid in main test functions. Consider
   * only for special cases where test result data needs to be returned to
   * calling context.
   */
  export interface IReturnStatement extends IStatementBase<"returnStatement"> {
    /**
     * Expression representing the value to be returned.
     *
     * Should evaluate to the appropriate return type expected by the function
     * signature. In test contexts, typically void or validation result
     * objects.
     */
    value: IExpression;
  }

  /**
   * Explicit error throwing for test failure scenarios.
   *
   * Used for custom error conditions or when specific business rule violations
   * should cause immediate test termination with descriptive error messages.
   *
   * E2E testing scenarios:
   *
   * - Custom validation failures
   * - Business rule violation detection
   * - Unexpected state conditions
   * - Critical error conditions that should halt test execution
   *
   * AI function calling usage: Use sparingly, primarily for business logic
   * violations that require explicit error reporting.
   */
  export interface IThrowStatement extends IStatementBase<"throwStatement"> {
    /**
     * Expression that evaluates to the error to be thrown.
     *
     * Typically an Error object construction with descriptive message
     * explaining the business context of the failure. Should provide clear
     * information about what business condition caused the error.
     *
     * Example: new Error("Customer verification failed: invalid email format")
     */
    expression: IExpression;
  }

  /** @ignore Base interface for type discrimination in statement union types. */
  interface IStatementBase<Type extends string> {
    type: Type;
  }

  /* ===========================================================
    EXPRESSIONS
      - BASIC
      - ACCESSORS
      - FUNCTIONAL
      - LITERALS
      - RANDOM
      - PREDICATES
  ==============================================================
    BASIC
  ----------------------------------------------------------- */
  /**
   * Union type encompassing all possible expressions in test scenarios.
   *
   * Expressions represent values, computations, and operations that can be used
   * within statements. This comprehensive set covers all necessary constructs
   * for building complex E2E test scenarios:
   *
   * Basic constructs:
   *
   * - Identifiers: Variable references
   * - Property/Element access: Object navigation
   * - Function calls: API invocations
   * - Literals: Direct values
   *
   * Advanced constructs:
   *
   * - Random generators: Test data creation
   * - Operators: Logical and arithmetic operations
   * - Arrow functions: Callback definitions
   * - Predicates: TestValidator validation operations
   *
   * AI selection strategy: Choose expression type based on the specific
   * operation needed in the business scenario being implemented.
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
    | IBooleanLiteral
    | INumericLiteral
    | IStringLiteral
    | IArrayLiteral
    | IObjectLiteral
    | INullLiteral
    | IUndefinedKeyword
    | IArrayRandom
    | IPickRandom
    | ISampleRandom
    | IBooleanRandom
    | IIntegerRandom
    | INumberRandom
    | IStringRandom
    | IPatternRandom
    | IFormatRandom
    | IDomainRandom
    | IEqualPredicate
    | INotEqualPredicate
    | IConditionalPredicate
    | IErrorPredicate;

  /** @ignore Base interface for type discrimination in expression union types. */
  interface IExpressionBase<Type extends string> {
    type: Type;
  }

  /* -----------------------------------------------------------
    ACCESSORS
  ----------------------------------------------------------- */
  /**
   * Identifier expression for referencing variables and functions.
   *
   * Represents references to previously declared variables, imported functions,
   * or global identifiers. Essential for data flow in test scenarios where
   * values from earlier steps are used in later operations.
   *
   * Common E2E testing usage:
   *
   * - Referencing captured API response data
   * - Accessing SDK function namespaces (e.g., "api")
   * - Using validation utilities (e.g., "TestValidator")
   * - Referencing business entities from previous steps
   *
   * AI function calling context: Use when referencing any named entity in the
   * test scope, whether variables, functions, or imported modules.
   */
  export interface IIdentifier extends IExpressionBase<"identifier"> {
    /**
     * The identifier name being referenced.
     *
     * Must correspond to a valid identifier in the current scope:
     *
     * - Previously declared variable names
     * - Imported function/module names
     * - Global utility names (api, TestValidator, typia)
     * - Parameter names from function scope
     *
     * Examples:
     *
     * - "seller" (previously declared variable)
     * - "api" (SDK namespace)
     * - "TestValidator" (validation utility)
     * - "connection" (function parameter)
     *
     * AI naming consistency: Must match exactly with variable names declared in
     * previous IVariableDeclaration statements.
     */
    text: string;
  }

  /**
   * Property access expression for object member navigation.
   *
   * Enables access to properties of objects, which is fundamental for
   * navigating API response data, SDK namespaces, and business entity
   * relationships in E2E test scenarios.
   *
   * Critical E2E testing patterns:
   *
   * - Accessing API response properties (customer.id, order.status)
   * - Navigating SDK function paths (api.functional.customers.orders)
   * - Extracting business data for subsequent operations
   * - Optional chaining for safe property access
   *
   * AI function calling usage: Essential for building the dot-notation chains
   * that characterize API calls and data access in test scenarios.
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
     * Examples:
     *
     * - IIdentifier("api") for api.functional
     * - IIdentifier("customer") for customer.id
     * - Previous property access for deeper chains
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
     * guaranteed API response structures and SDK paths.
     */
    questionDot: boolean;

    /**
     * The property name being accessed.
     *
     * Must be a valid property name on the base expression's type. Should
     * correspond to actual properties defined in DTO schemas or SDK function
     * names.
     *
     * Examples:
     *
     * - "id" (for entity identifiers)
     * - "functional" (for SDK namespace)
     * - "customers" (for API endpoint group)
     * - "status" (for business state properties)
     *
     * AI validation requirement: Ensure property exists on the base
     * expression's type according to schema definitions.
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
   * E2E testing scenarios:
   *
   * - Array element access (order.items[0])
   * - Dynamic property access with string keys
   * - Accessing properties with special characters
   * - Computed property access based on test data
   *
   * AI function calling context: Use when property access requires computation
   * or when accessing array elements by index.
   */
  export interface IElementAccessExpression
    extends IExpressionBase<"elementAccessExpression"> {
    /**
     * The base expression being indexed/accessed.
     *
     * Can be any expression that evaluates to an object or array. Typically
     * represents collections or objects with dynamic properties.
     */
    expression: IExpression;

    /**
     * Whether to use optional chaining (?.[]) operator.
     *
     * True: Uses ?.[] for safe element access False: Uses [] for standard
     * element access
     *
     * Use optional chaining when the base expression might be null/undefined or
     * when the accessed element might not exist.
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
   * Used primarily for callback functions required by certain API calls or
   * utility functions. In E2E testing, commonly needed for array operations,
   * event handlers, or specialized SDK functions that require function
   * parameters.
   *
   * E2E testing scenarios:
   *
   * - Array mapping for data transformation
   * - Filter functions for data selection
   * - Callback functions for async operations
   * - Custom validation functions
   *
   * AI function calling usage: Generate when API calls require function
   * parameters or when data transformation is needed within the test flow.
   */
  export interface IArrowFunction extends IExpressionBase<"arrowFunction"> {
    /**
     * The function body containing the function's logic.
     *
     * Contains the statements that comprise the function's implementation. In
     * test contexts, typically contains simple operations like data
     * transformation, validation, or API calls.
     *
     * Should represent meaningful business logic rather than arbitrary
     * computational operations.
     */
    body: IBlock;
  }

  /**
   * Function call expression for API invocations and utility function calls.
   *
   * The most critical expression type for E2E testing, representing all
   * function calls including:
   *
   * - SDK API calls (api.functional.customers.create)
   * - Validation functions (TestValidator.equals)
   * - Utility functions (typia.assert)
   * - Helper functions
   *
   * AI function calling importance: This is the primary mechanism for executing
   * business operations in test scenarios. Each call typically represents a
   * discrete business action.
   */
  export interface ICallExpression extends IExpressionBase<"callExpression"> {
    /**
     * Expression representing the function to be called.
     *
     * Typically a property access chain for SDK functions:
     *
     * - Api.functional.customers.authenticate.join
     * - TestValidator.equals
     * - Typia.assert
     *
     * Can also be a simple identifier for direct function references.
     *
     * AI requirement: Must resolve to a callable function according to the
     * available SDK and utility functions.
     */
    expression: IExpression;

    /**
     * Array of argument expressions passed to the function.
     *
     * Each argument must match the expected parameter type of the called
     * function. Order and types must correspond exactly to the function
     * signature defined in SDK or utility documentation.
     *
     * Common patterns:
     *
     * - Connection parameter (first argument for SDK calls)
     * - Request body objects for API calls
     * - Validation parameters for TestValidator calls
     *
     * AI validation: Ensure argument types and count match the target
     * function's signature exactly.
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
   * - Custom object instantiation when required by APIs
   *
   * E2E testing context: Most commonly used for creating Error objects in throw
   * statements or Date objects for time-sensitive test data.
   *
   * AI function calling usage: Use when business logic requires explicit object
   * instantiation rather than literal values.
   */
  export interface INewExpression extends IExpressionBase<"newExpression"> {
    /**
     * Expression representing the constructor function.
     *
     * Typically an identifier for built-in constructors:
     *
     * - "Error" for error objects
     * - "Date" for date objects
     * - Custom class identifiers when needed
     */
    expression: IExpression;

    /**
     * Arguments passed to the constructor.
     *
     * Must match the constructor's parameter signature. For Error objects:
     * typically string message For Date objects: typically string or number
     * timestamp
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
   * E2E testing scenarios:
   *
   * - Conditional parameter values based on test data
   * - Dynamic value selection based on business rules
   * - Fallback value specification
   *
   * AI function calling context: Use when business logic requires different
   * values based on runtime conditions within expressions.
   */
  export interface IConditionalExpression
    extends IExpressionBase<"conditionalExpression"> {
    /**
     * Boolean condition determining which value to select.
     *
     * Should represent meaningful business logic conditions rather than
     * arbitrary technical conditions.
     */
    condition: IExpression;

    /**
     * Expression evaluated and returned when condition is true.
     *
     * Represents the primary or expected value for the business scenario.
     */
    whenTrue: IExpression;

    /**
     * Expression evaluated and returned when condition is false.
     *
     * Represents the alternative or fallback value for the business scenario.
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
   * - Logical negation for condition inversion
   * - Increment/decrement for counter operations
   *
   * AI function calling context: Use for simple unary operations needed in
   * business logic conditions or calculations.
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
     * For "!": typically boolean expressions or conditions For "++/--":
     * typically variable identifiers
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
   * - Loop iteration variables
   *
   * AI function calling context: Use when the original value is needed before
   * the increment/decrement operation.
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
     * Typically variable identifiers that need modification.
     */
    operand: IExpression;
  }

  /**
   * Binary expression for operations between two operands.
   *
   * Represents all binary operations including comparison, arithmetic, and
   * logical operations. Essential for implementing business logic conditions,
   * calculations, and validations in test scenarios.
   *
   * E2E testing importance: Critical for implementing business rule
   * validations, data comparisons, and conditional logic that reflects
   * real-world application behavior.
   */
  export interface IBinaryExpression
    extends IExpressionBase<"binaryExpression"> {
    /**
     * Left operand of the binary operation.
     *
     * Typically represents the primary value being compared or operated upon.
     * In business contexts, often represents actual values from API responses
     * or business entities.
     */
    left: IExpression;

    /**
     * Binary operator defining the operation type.
     *
     * Comparison operators:
     *
     * - "===", "!==": Strict equality/inequality (preferred for type safety)
     * - "<", "<=", ">", ">=": Numerical/string comparisons
     *
     * Arithmetic operators:
     *
     * - "+", "-", "*", "/", "%": Mathematical operations
     *
     * Logical operators:
     *
     * - "&&": Logical AND (both conditions must be true)
     * - "||": Logical OR (either condition can be true)
     *
     * AI selection guide: Use === for equality checks, logical operators for
     * combining business conditions, arithmetic for calculations.
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
     * represents expected values or business rule thresholds.
     */
    right: IExpression;
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
   * - Validation results
   * - Configuration options
   */
  export interface IBooleanLiteral extends IExpressionBase<"booleanLiteral"> {
    /**
     * The boolean value (true or false).
     *
     * Should represent meaningful business states rather than arbitrary
     * true/false values. Consider the business context when selecting the
     * value.
     */
    value: boolean;
  }

  /**
   * Numeric literal for number values.
   *
   * Represents direct numeric values including integers, decimals, and
   * floating-point numbers. Essential for business data like quantities,
   * prices, scores, and identifiers.
   *
   * E2E testing scenarios:
   *
   * - Product quantities and prices
   * - Score values and ratings
   * - Pagination parameters (page, limit)
   * - Business thresholds and limits
   * - Mathematical calculations
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
   * reflects actual user input and system behavior.
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
     *
     * AI content strategy: Use meaningful, realistic values that reflect actual
     * business scenarios rather than placeholder text.
     */
    value: string;
  }

  /**
   * Array literal for creating array values directly.
   *
   * Represents direct array construction with explicit elements. Essential for
   * providing list data in test scenarios such as multiple products, user
   * lists, or configuration arrays.
   *
   * E2E testing scenarios:
   *
   * - Product lists for bulk operations
   * - Tag arrays for categorization
   * - File upload arrays
   * - Configuration option lists
   * - Multiple entity creation
   *
   * AI function calling usage: Use when business scenarios require explicit
   * list data rather than dynamic array generation.
   */
  export interface IArrayLiteral extends IExpressionBase<"arrayLiteral"> {
    /**
     * Array of expressions representing the array elements.
     *
     * Each element can be any valid expression (literals, identifiers, function
     * calls, etc.). Elements should represent meaningful business data
     * appropriate for the array's purpose.
     *
     * Examples:
     *
     * - [product1, product2, product3] for entity arrays
     * - ["electronics", "gadgets"] for category tags
     * - [{ name: "file1.jpg" }, { name: "file2.jpg" }] for file lists
     *
     * AI content strategy: Populate with realistic business data that reflects
     * actual usage patterns.
     */
    elements: IExpression[];
  }

  /**
   * Object literal for creating object values directly.
   *
   * Represents direct object construction with explicit properties. The primary
   * mechanism for creating request bodies, configuration objects, and
   * structured data in E2E test scenarios.
   *
   * E2E testing importance: Critical for API request bodies and configuration
   * objects that drive business operations.
   */
  export interface IObjectLiteral extends IExpressionBase<"objectLiteral"> {
    /**
     * Array of property assignments defining the object structure.
     *
     * Each property represents a key-value pair in the object. Properties
     * should correspond to actual DTO structure requirements and business data
     * needs.
     *
     * Must align with API schema requirements when used for request bodies.
     * Property names and value types should match expected DTO interfaces.
     *
     * AI validation requirement: Ensure properties match the target schema
     * definition exactly, including required fields and types.
     */
    properties: IPropertyAssignment[];
  }

  /**
   * Null literal for explicit null values.
   *
   * Represents explicit null values used in business scenarios where absence of
   * data is meaningful. Important for optional fields, cleared states, and
   * explicit "no value" conditions.
   *
   * E2E testing scenarios:
   *
   * - Optional relationship fields
   * - Cleared user preferences
   * - Explicit "no selection" states
   * - Default null values for optional business data
   *
   * AI decision context: Use when business logic specifically requires null
   * rather than undefined or omitted properties.
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
   * null in typical business scenarios.
   *
   * E2E testing usage:
   *
   * - Explicit undefined state representation
   * - Clearing previously set values
   * - API parameters that distinguish between null and undefined
   *
   * AI guidance: Prefer null over undefined unless specific business or API
   * requirements dictate undefined usage.
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
   * Random array generator for dynamic test data creation.
   *
   * Generates arrays with random length and elements using a generator
   * function. Essential for creating realistic test data that simulates
   * variable-length business collections like product lists, user arrays, or
   * transaction histories.
   *
   * E2E testing importance: Enables testing with realistic data volumes and
   * variations that reflect real-world usage patterns.
   *
   * AI function calling strategy: Use when business scenarios require
   * collections of variable size rather than fixed arrays.
   */
  export interface IArrayRandom extends IExpressionBase<"arrayRandom"> {
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
     * realistic business entities (products, users, orders, etc.).
     *
     * AI implementation requirement: Generate meaningful business data rather
     * than arbitrary random values.
     */
    generate: IArrowFunction;
  }

  /**
   * Random picker for selecting from predefined options.
   *
   * Randomly selects one element from a provided array or collection. Essential
   * for choosing from predefined business options like categories, statuses, or
   * configuration values.
   *
   * E2E testing scenarios:
   *
   * - Random category selection from available options
   * - Status selection from valid business states
   * - Configuration option selection
   * - User role assignment from available roles
   *
   * AI function calling usage: Use when business logic requires selection from
   * a constrained set of valid options.
   */
  export interface IPickRandom extends IExpressionBase<"pickRandom"> {
    /**
     * Expression evaluating to the collection from which to pick.
     *
     * Typically an array literal containing valid business options or an
     * identifier referencing a predefined collection.
     *
     * Examples:
     *
     * - Array of category names: ["electronics", "clothing", "books"]
     * - Array of status values: ["pending", "approved", "rejected"]
     * - Array of configuration options
     *
     * AI requirement: Ensure all options in the collection are valid for the
     * business context where the selection will be used.
     */
    expression: IExpression;
  }

  /**
   * Random sampler for selecting multiple items from a collection.
   *
   * Randomly selects a specified number of elements from a provided collection
   * without duplication. Useful for creating realistic subsets of business data
   * like featured products, selected users, or sample transactions.
   *
   * E2E testing scenarios:
   *
   * - Selecting featured products from catalog
   * - Choosing random users for notifications
   * - Sampling transactions for analysis
   * - Creating test data subsets
   *
   * AI function calling context: Use when business scenarios require multiple
   * selections from a larger set without duplication.
   */
  export interface ISampleRandom extends IExpressionBase<"sampleRandom"> {
    /**
     * Expression evaluating to the collection from which to sample.
     *
     * Should contain more elements than the count to enable meaningful random
     * selection. Elements should be valid business entities appropriate for the
     * sampling context.
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
     * use case and available collection size.
     */
    count: number;
  }

  /**
   * Random boolean generator for true/false values with probability control.
   *
   * Generates boolean values with optional probability weighting. Useful for
   * simulating business scenarios with probabilistic outcomes like feature
   * flags, user preferences, or conditional states.
   *
   * E2E testing scenarios:
   *
   * - Random feature flag states
   * - User preference simulation
   * - Conditional business logic testing
   * - Random yes/no decisions
   *
   * AI function calling usage: Use when business logic involves probabilistic
   * boolean outcomes rather than deterministic values.
   */
  export interface IBooleanRandom extends IExpressionBase<"booleanRandom"> {
    /**
     * Probability of generating true (0.0 to 1.0).
     *
     * Null: 50/50 probability (default random boolean) 0.0: Always false 1.0:
     * Always true 0.7: 70% chance of true, 30% chance of false
     *
     * Should reflect realistic business probabilities:
     *
     * - High probability (0.8-0.9) for common positive states
     * - Low probability (0.1-0.2) for rare conditions
     * - Default (null) for balanced scenarios
     *
     * AI probability selection: Choose based on real-world business likelihood
     * of the condition being true.
     */
    probability: number | null;
  }

  /**
   * Random integer generator with business-appropriate constraints.
   *
   * Generates random integer values within specified ranges and constraints.
   * Essential for creating realistic business numeric data like quantities,
   * counts, scores, and identifiers.
   *
   * E2E testing importance: Provides realistic numeric data that reflects
   * actual business value ranges and constraints.
   */
  export interface IIntegerRandom extends IExpressionBase<"integerRandom"> {
    /**
     * Minimum value (inclusive).
     *
     * Null: No minimum constraint number: Specific minimum value
     *
     * Should reflect business constraints:
     *
     * - 0 for non-negative quantities
     * - 1 for positive-only values
     * - Business-specific minimums for scores, ratings, etc.
     *
     * AI constraint setting: Choose minimums that make business sense for the
     * specific data type being generated.
     */
    minimum: number | null;

    /**
     * Maximum value (inclusive).
     *
     * Null: No maximum constraint number: Specific maximum value
     *
     * Should reflect realistic business limits:
     *
     * - 100 for percentage values
     * - 5 for rating scales
     * - Reasonable inventory quantities
     * - Business-specific maximums
     *
     * AI constraint setting: Choose maximums that reflect real-world business
     * limits and system constraints.
     */
    maximum: number | null;

    /**
     * Multiple constraint for generated values.
     *
     * Null: No multiple constraint number: Generated value must be multiple of
     * this number
     *
     * Business use cases:
     *
     * - 5 for rating systems (0, 5, 10, 15, ...)
     * - 10 for price increments
     * - Custom business increment requirements
     *
     * AI usage: Apply when business rules require specific value increments.
     */
    multipleOf: number | null;
  }

  /**
   * Random number generator for decimal/floating-point values.
   *
   * Generates random decimal values within specified ranges and constraints.
   * Essential for business data like prices, percentages, measurements, and
   * calculated values.
   *
   * E2E testing scenarios:
   *
   * - Product prices and costs
   * - Percentage values and rates
   * - Measurement data
   * - Financial calculations
   * - Performance metrics
   */
  export interface INumberRandom extends IExpressionBase<"numberRandom"> {
    /**
     * Minimum value (inclusive).
     *
     * Null: No minimum constraint number: Specific minimum value (can be
     * decimal)
     *
     * Business considerations:
     *
     * - 0.0 for non-negative amounts
     * - 0.01 for minimum price values
     * - Business-specific decimal minimums
     *
     * AI constraint setting: Consider business rules for minimum values,
     * especially for monetary and measurement data.
     */
    minimum: number | null;

    /**
     * Maximum value (inclusive).
     *
     * Null: No maximum constraint number: Specific maximum value (can be
     * decimal)
     *
     * Business considerations:
     *
     * - 100.0 for percentage values
     * - Realistic price ranges for products
     * - System limits for calculations
     *
     * AI constraint setting: Set realistic upper bounds based on business
     * context and system capabilities.
     */
    maximum: number | null;

    /**
     * Multiple constraint for decimal precision.
     *
     * Null: No multiple constraint number: Generated value must be multiple of
     * this number
     *
     * Business use cases:
     *
     * - 0.01 for currency precision (cents)
     * - 0.5 for half-point rating systems
     * - Custom precision requirements
     *
     * AI precision consideration: Match business precision requirements for the
     * specific data type (currency, measurements, etc.).
     */
    multipleOf: number | null;
  }

  /**
   * Random string generator with length constraints.
   *
   * Generates random strings within specified length ranges. Useful for
   * creating variable-length text data like names, descriptions, codes, and
   * identifiers.
   *
   * E2E testing scenarios:
   *
   * - User names and nicknames
   * - Product descriptions
   * - Generated codes and tokens
   * - Text content of varying lengths
   * - Password generation
   */
  export interface IStringRandom extends IExpressionBase<"stringRandom"> {
    /**
     * Minimum string length.
     *
     * Null: No minimum length constraint number: Minimum number of characters
     *
     * Business considerations:
     *
     * - 3 for minimum usernames
     * - 8 for minimum passwords
     * - 1 for required non-empty fields
     * - Business-specific minimum requirements
     *
     * AI length setting: Consider business validation rules and user experience
     * requirements for minimum lengths.
     */
    minLength: number | null;

    /**
     * Maximum string length.
     *
     * Null: No maximum length constraint number: Maximum number of characters
     *
     * Business considerations:
     *
     * - 255 for typical database field limits
     * - 50 for names and titles
     * - 1000 for descriptions
     * - System-specific character limits
     *
     * AI length setting: Respect database constraints and UI limitations while
     * allowing realistic content length variation.
     */
    maxLength: number | null;
  }

  /**
   * Pattern-based random string generator.
   *
   * Generates strings matching specific patterns using regular expressions or
   * format strings. Essential for creating data that matches exact business
   * format requirements like codes, identifiers, and structured text.
   *
   * E2E testing scenarios:
   *
   * - Product SKU generation
   * - User ID formats
   * - Business code patterns
   * - Structured identifier creation
   * - Format-specific text generation
   *
   * AI pattern usage: Ensure patterns match actual business format requirements
   * and validation rules.
   */
  export interface IPatternRandom extends IExpressionBase<"patternRandom"> {
    /**
     * Regular expression pattern for string generation.
     *
     * Defines the exact format structure for generated strings. Should match
     * business format requirements and validation patterns.
     *
     * Examples:
     *
     * - "SKU-[0-9]{6}" for product SKUs
     * - "[A-Z]{3}-[0-9]{4}" for order codes
     * - "[a-z]{5,10}" for username patterns
     *
     * AI pattern creation: Ensure patterns generate valid data that passes
     * business validation rules and format requirements.
     */
    pattern: string;
  }

  /**
   * Format-based random data generator.
   *
   * Generates data matching specific standardized formats like emails, UUIDs,
   * dates, and URLs. Critical for creating valid business data that conforms to
   * standard formats and validation requirements.
   *
   * E2E testing importance: Ensures generated data passes format validation and
   * represents realistic business data types.
   */
  export interface IFormatRandom extends IExpressionBase<"formatRandom"> {
    /**
     * Standardized format specification for data generation.
     *
     * Supports common business data formats:
     *
     * Security & Encoding:
     *
     * - "binary": Binary data representation
     * - "byte": Base64 encoded data
     * - "password": Password strings
     * - "regex": Regular expression patterns
     *
     * Identifiers:
     *
     * - "uuid": Universally unique identifiers
     *
     * Network & Communication:
     *
     * - "email": Email addresses
     * - "hostname": Network hostnames
     * - "idn-email": Internationalized email addresses
     * - "idn-hostname": Internationalized hostnames
     * - "ipv4": IPv4 addresses
     * - "ipv6": IPv6 addresses
     *
     * Web & URI:
     *
     * - "uri": Uniform Resource Identifiers
     * - "iri": Internationalized Resource Identifiers
     * - "iri-reference": IRI references
     * - "uri-reference": URI references
     * - "uri-template": URI templates
     * - "url": Web URLs
     *
     * Date & Time:
     *
     * - "date-time": ISO 8601 date-time strings
     * - "date": Date-only strings
     * - "time": Time-only strings
     * - "duration": Time duration strings
     *
     * JSON & Pointers:
     *
     * - "json-pointer": JSON Pointer strings
     * - "relative-json-pointer": Relative JSON Pointers
     *
     * AI format selection: Choose formats that match the business context and
     * validation requirements of the target field.
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
   * real-world business scenarios and user behavior.
   *
   * E2E testing importance: Creates realistic test data that closely mimics
   * actual user input and business content, improving test scenario
   * authenticity and catching real-world edge cases.
   */
  export interface IDomainRandom extends IExpressionBase<"domainRandom"> {
    /**
     * Domain-specific data generation keyword.
     *
     * Predefined generators for common business data types:
     *
     * Text & Content:
     *
     * - "alphabets": Random alphabetic strings
     * - "alphaNumeric": Random alphanumeric strings
     * - "paragraph": Realistic paragraph text
     * - "content": Generic content text
     *
     * Personal Information:
     *
     * - "mobile": Mobile phone numbers
     * - "name": Personal names (first, last, full)
     *
     * AI domain selection: Choose domains that provide realistic data
     * appropriate for the business context and field purpose.
     *
     * Usage strategy:
     *
     * - Use "name" for user registration scenarios
     * - Use "mobile" for contact information
     * - Use "paragraph" for descriptions and content
     * - Use "content" for general text fields
     * - Use "alphabets"/"alphaNumeric" for codes and identifiers
     */
    keyword:
      | "alphabets"
      | "alphaNumeric"
      | "paragraph"
      | "content"
      | "mobile"
      | "name";
  }

  /* -----------------------------------------------------------
    PREDICATES
  ----------------------------------------------------------- */
  /**
   * Equality validation predicate for TestValidator assertion.
   *
   * Generates TestValidator.equals() calls to verify that two values are equal.
   * This is the most commonly used validation pattern in E2E tests for
   * confirming API responses match expected values and ensuring data integrity
   * throughout business workflows.
   *
   * E2E testing scenarios:
   *
   * - Verifying API response data matches expected values
   * - Confirming entity IDs are correctly preserved across operations
   * - Validating state transitions in business workflows
   * - Ensuring data consistency after CRUD operations
   *
   * AI function calling usage: Use after API calls to validate response data
   * and confirm business logic execution. Essential for maintaining test
   * reliability and catching regressions.
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
     * data from earlier test steps.
     *
     * Common patterns:
     *
     * - String literals for expected names, statuses, or codes
     * - Numeric literals for expected quantities, prices, or scores
     * - Identifiers referencing captured entity IDs or data
     * - Object literals for expected data structures
     *
     * AI value selection: Choose expected values that reflect realistic
     * business outcomes and match the API response schema.
     */
    x: IExpression;

    /**
     * Actual value expression (second parameter to TestValidator.equals).
     *
     * Represents the actual value returned from API calls or business
     * operations that needs validation. Often property access expressions
     * extracting specific fields from API responses.
     *
     * Common patterns:
     *
     * - Property access for API response fields (response.id, order.status)
     * - Identifiers for captured variables
     * - Array/object element access for nested data
     * - Function call results for computed values
     *
     * AI expression construction: Ensure the actual value expression extracts
     * the correct data from API responses according to the schema structure.
     */
    y: IExpression;
  }

  /**
   * Inequality validation predicate for TestValidator assertion.
   *
   * Generates TestValidator.equals(false)(typia.is<Type>(value)) calls to
   * verify that values are NOT equal or that a value is NOT of a specific type.
   * Used for negative validations and ensuring values have changed or differ
   * from previous states.
   *
   * E2E testing scenarios:
   *
   * - Verifying values have changed after update operations
   * - Confirming different entities have different identifiers
   * - Ensuring sensitive data is not exposed in responses
   * - Validating that values are NOT of unexpected types
   *
   * AI function calling usage: Use when business logic requires confirming
   * differences or ensuring values have been modified. Important for testing
   * update operations and data transformations.
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
     * earlier test steps or represents a baseline state.
     *
     * Common patterns:
     *
     * - Original values before update operations
     * - Different entity identifiers
     * - Previous state values
     * - Baseline data for comparison
     */
    x: IExpression;

    /**
     * Second value expression for comparison.
     *
     * Represents the new value, current state, or value that should differ from
     * the first expression. Often the result of API operations or updated
     * data.
     *
     * Common patterns:
     *
     * - Updated values after modification operations
     * - Current entity states
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
   * assertions that depend on runtime data or business rules.
   *
   * E2E testing scenarios:
   *
   * - Validating business rule compliance
   * - Checking conditional states (user roles, feature flags)
   * - Verifying complex boolean logic conditions
   * - Ensuring data meets business constraints
   *
   * AI function calling usage: Use when test validation depends on evaluating
   * business conditions rather than simple equality checks. Essential for
   * testing complex business logic and rule-based systems.
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
     * rules and data checks.
     *
     * Common patterns:
     *
     * - Comparison expressions (price > minimum, status === "active")
     * - Logical combinations (hasPermission && isActive)
     * - Type checks using typia.is<Type>(value)
     * - Complex business rule evaluations
     *
     * AI condition construction: Build conditions that accurately represent
     * business rules and constraints relevant to the test scenario.
     */
    condition: IExpression;
  }

  /**
   * Error validation predicate for TestValidator assertion.
   *
   * Generates TestValidator.error() or TestValidator.httpError() calls to
   * verify that operations correctly throw errors under specific conditions.
   * Critical for testing error handling, business rule violations, and security
   * constraints.
   *
   * E2E testing scenarios:
   *
   * - Testing authentication failures with invalid credentials
   * - Verifying authorization errors for restricted operations
   * - Confirming validation errors for invalid input data
   * - Ensuring proper error responses for business rule violations
   *
   * AI function calling usage: Use when business scenarios should intentionally
   * fail to test error handling and system security. Essential for negative
   * testing and ensuring robust error responses.
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
     * Encapsulates the API call or operation that is expected to fail. The
     * function should contain realistic business operations with invalid data
     * or unauthorized access attempts that trigger appropriate error
     * responses.
     *
     * Common patterns:
     *
     * - API calls with invalid authentication credentials
     * - Operations with malformed or missing required data
     * - Unauthorized access attempts to restricted resources
     * - Business rule violations that should be rejected
     *
     * AI function construction: Create realistic error scenarios that test
     * actual business constraints and security measures rather than arbitrary
     * technical failures.
     */
    function: IArrowFunction;
  }

  /* -----------------------------------------------------------
    INTERNALS
  ----------------------------------------------------------- */
  /**
   * Property assignment for object literal construction.
   *
   * Represents individual key-value pairs within object literals. Critical for
   * building request bodies, configuration objects, and structured data that
   * conforms to API schemas and business requirements.
   *
   * E2E testing importance: Each property assignment must align with DTO schema
   * requirements to ensure valid API requests and realistic business data
   * representation.
   *
   * AI function calling requirement: Property names and value types must match
   * target schema definitions exactly.
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
     * Examples:
     *
     * - "name" for entity names
     * - "email" for contact information
     * - "price" for monetary values
     * - "createdAt" for timestamps
     * - "isActive" for boolean flags
     *
     * AI validation requirement: Ensure property names exist in the target
     * schema and follow exact naming conventions.
     */
    name: string;

    /**
     * Property value expression.
     *
     * Expression that evaluates to the property value. Type must match the
     * expected type for this property in the target schema. Should represent
     * realistic business data appropriate for the property's purpose.
     *
     * Common patterns:
     *
     * - String literals for names, descriptions, codes
     * - Numeric literals for quantities, prices, scores
     * - Boolean literals for flags and states
     * - Object literals for nested business data
     * - Array literals for collections
     * - Random generators for variable test data
     * - Identifiers for referencing captured data
     *
     * AI type matching: Must generate expressions that produce values
     * compatible with the target property's schema type.
     */
    value: IExpression;
  }
}
