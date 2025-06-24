import { AutoBeOpenApi } from "@autobe/interface";

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
    /** Target API endpoint to test. */
    endpoint: AutoBeOpenApi.IEndpoint;

    /** Array of test scenarios. */
    scenarios: IScenario[];
  }

  /**
   * Represents a test scenario for a single API operation.
   *
   * This interface extends `AutoBeOpenApi.IEndpoint`, inheriting its HTTP
   * method and path information, and adds two key properties:
   *
   * - `draft`: A free-form, human-readable test scenario description for the API
   *   endpoint.
   * - `dependsOn`: A list of other API endpoints that must be invoked beforehand
   *   in order to prepare the context for this test. Each dependency includes
   *   the purpose of the dependency.
   *
   * This structure is intended to help organize test specifications for complex
   * workflows and ensure that all prerequisites are explicitly declared.
   */
  export interface IScenario {
    /**
     * A detailed natural language description of how this API endpoint should
     * be tested. This should include both successful and failure scenarios,
     * business rule validations, edge cases, and any sequence of steps
     * necessary to perform the test. A subsequent agent will use this draft to
     * generate multiple test scenarios.
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
     * - Must start with `test_` prefix (mandatory requirement)
     * - Use snake_case formatting throughout
     * - Include the primary user action (create, get, update, delete, list, etc.)
     * - Specify the target resource (user, product, order, profile, etc.)
     * - Add scenario-specific context (valid_data, invalid_email, not_found,
     *   etc.)
     *
     * ## Content Structure
     *
     * Function names should follow this pattern:
     * `test_[user_action]_[resource]_[scenario_context]`
     *
     * Where:
     *
     * - `user_action`: What the user is trying to do
     * - `resource`: What the user is interacting with
     * - `scenario_context`: The specific situation or condition
     *
     * ## User-Focused Examples
     *
     * - `test_create_user_profile_with_complete_information` - User providing all
     *   available profile data
     * - `test_retrieve_user_profile_when_profile_exists` - User accessing their
     *   existing profile
     * - `test_update_user_email_with_valid_new_address` - User changing their
     *   email to a valid new one
     * - `test_delete_user_account_when_user_lacks_permission` - User attempting
     *   account deletion without authorization
     * - `test_search_user_profiles_with_pagination_preferences` - User browsing
     *   profiles with specific pagination
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
    functionName: string;

    /**
     * A list of other API endpoints that must be executed before this test
     * scenario. This helps express dependencies such as data creation or
     * authentication steps required to reach the intended test state.
     */
    dependsOn: IDependsOn[];
  }

  export interface IDependsOn {
    /** Target API endpoint that must be executed before the main operation. */
    endpoint: AutoBeOpenApi.IEndpoint;

    /**
     * A concise exscenarioation of why this API call is required before
     * executing the test for the main operation.
     *
     * Example: "Creates a category so that a product can be linked to it during
     * creation."
     */
    purpose: string;
  }
}
