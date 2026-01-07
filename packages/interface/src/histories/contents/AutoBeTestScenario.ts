import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";
import { SnakeCasePattern } from "../../typings/SnakeCasePattern";
import { AutoBeTestScenarioDependency } from "./AutoBeTestScenarioDependency";

/**
 * Test scenario specification for E2E testing of a single API endpoint.
 *
 * Defines comprehensive test strategy including endpoint details, test description,
 * function name, and prerequisite dependencies with proper execution ordering.
 */
export interface AutoBeTestScenario {
  /**
   * The API endpoint being tested.
   *
   * Contains the complete endpoint specification including URL, method,
   * parameters, and expected responses that will be validated by this test
   * scenario.
   */
  endpoint: AutoBeOpenApi.IEndpoint;

  /**
   * A detailed natural language description of how this API endpoint should be
   * tested. This should include both successful and failure scenarios, business
   * rule validations, edge cases, and any sequence of steps necessary to
   * perform the test. A subsequent agent will use this draft to generate
   * multiple concrete test cases.
   */
  draft: string;

  /**
   * Descriptive function name derived from the user scenario.
   *
   * The function name serves as a concise, technical identifier that clearly
   * represents the specific user scenario being described. It should be
   * immediately understandable and directly correspond to the user situation
   * without requiring additional context.
   *
   * ## Naming Convention
   *
   * DO: Use snake_case naming convention.
   *
   * - Must start with `test_api_` prefix (mandatory requirement)
   * - ALWAYS start with business feature, NOT action verbs
   * - Business feature comes first, followed by scenario context
   * - Embed action verbs within the scenario description, not at the beginning
   *
   * ## Content Structure
   *
   * Function names should follow this pattern:
   * `test_api_[core_feature]_[specific_scenario]`
   *
   * Where:
   *
   * - `core_feature`: The main business feature or entity being tested (customer,
   *   seller, cart, push_message, etc.)
   * - `specific_scenario`: The specific operation or scenario context
   *   (join_verification_not_found, login_success, moderator_assignment_update,
   *   discountable_ticket_duplicated, csv_export, etc.)
   *
   * ## Business Feature-Based Examples
   *
   * - `test_api_customer_join_verification_not_found` - Customer join
   *   verification when verification code not found
   * - `test_api_seller_login` - Seller login operation
   * - `test_api_cart_discountable_ticket_duplicated` - Cart discountable ticket
   *   with duplication scenario
   * - `test_api_push_message_csv` - Push message functionality with CSV format
   * - `test_api_product_review_update` - Product review update operation
   *
   * ## Clarity Guidelines
   *
   * - Prioritize clarity over brevity
   * - Avoid technical jargon or implementation terms
   * - Use terminology that reflects user perspective
   * - Ensure the name alone conveys the user's intent
   * - Make it understandable to non-technical stakeholders
   * - Keep consistent with user scenario description
   *
   * ## Single Endpoint Alignment
   *
   * Function names must reflect scenarios that:
   *
   * - Accomplish user goals through this single endpoint only
   * - Don't imply dependency on other API operations
   * - Represent complete user interactions
   */
  functionName: string & SnakeCasePattern;

  /**
   * A list of other API endpoints that this scenario logically depends on.
   *
   * These dependencies represent context or prerequisite conditions, such as
   * authentication, resource creation, or data setup, that are relevant to the
   * test. This list is not a strict execution order — if ordering is important,
   * it must be described explicitly in the `purpose`.
   *
   * WARNING: Every endpoint referenced here MUST exist in the provided API
   * operations. Do NOT reference endpoints that are not explicitly available,
   * even if they seem logically necessary based on database schema or business
   * logic.
   */
  dependencies: AutoBeTestScenarioDependency[];
}
