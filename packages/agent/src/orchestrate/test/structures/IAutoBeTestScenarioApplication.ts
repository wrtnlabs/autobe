import { AutoBeOpenApi, SnakePattern } from "@autobe/interface";
import { tags } from "typia";

export interface IAutoBeTestScenarioApplication {
  /**
   * Make test scenarios for the given endpoints.
   *
   * @param props Properties containing the endpoints and test scenarios.
   */
  makeScenario(props: IAutoBeTestScenarioApplication.IProps): void;
}

export namespace IAutoBeTestScenarioApplication {
  export interface IProps {
    /** Array of test scenario groups. */
    scenarioGroups: IAutoBeTestScenarioApplication.IScenarioGroup[];
  }

  export interface IScenarioGroup {
    /**
     * Target API endpoint to test.
     *
     * This must be **unique** across all scenario groups. An endpoint is
     * identified by its `path` and `method` combination.
     *
     * Multiple test scenarios may exist for a single endpoint.
     */
    endpoint: AutoBeOpenApi.IEndpoint;

    /**
     * An array of test scenarios associated with the given endpoint.
     *
     * Each scenario represents a specific test case for the same `path` and
     * `method`.
     */
    scenarios: IScenario[] & tags.MinItems<1>;
  }

  /**
   * Represents a test scenario for a single API operation.
   *
   * This interface defines a structured, user-centric test draft that includes
   * a descriptive function name, a detailed scenario draft, and logical
   * dependencies on other endpoints required for context or setup.
   */
  export interface IScenario {
    /**
     * A detailed natural language description of how this API endpoint should
     * be tested. This should include both successful and failure scenarios,
     * business rule validations, edge cases, and any sequence of steps
     * necessary to perform the test. A subsequent agent will use this draft to
     * generate multiple concrete test cases.
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
     * - `core_feature`: The main business feature or entity being tested
     *   (customer, seller, cart, push_message, etc.)
     * - `specific_scenario`: The specific operation or scenario context
     *   (join_verification_not_found, login_success,
     *   moderator_assignment_update, discountable_ticket_duplicated,
     *   csv_export, etc.)
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
    functionName: string & SnakePattern;

    /**
     * A list of other API endpoints that this scenario logically depends on.
     *
     * These dependencies represent context or prerequisite conditions, such as
     * authentication, resource creation, or data setup, that are relevant to
     * the test. This list is not a strict execution order — if ordering is
     * important, it must be described explicitly in the `purpose`.
     */
    dependencies: IDependencies[];
  }

  export interface IDependencies {
    /** Target API endpoint that this scenario depends on. */
    endpoint: AutoBeOpenApi.IEndpoint;

    /**
     * A concise explanation of why this API call is relevant or required for
     * the main test scenario.
     *
     * This should describe the contextual or setup role of the dependency, such
     * as creating necessary data or establishing user authentication.
     *
     * Example: "Creates a category so that a product can be linked to it during
     * creation."
     */
    purpose: string;
  }
}
