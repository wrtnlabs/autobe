import { AutoBeOpenApi } from "../openapi";

export namespace AutoBeTest {
  export interface IScenario {
    /**
     * Target API endpoint for user scenario generation.
     *
     * This represents the single API endpoint that will be analyzed to generate
     * comprehensive user scenarios. The endpoint contains all technical
     * specifications needed to understand user interactions, including HTTP
     * methods, paths, parameters, request/response schemas, and authentication
     * requirements.
     *
     * ## Core Purpose
     *
     * - Serves as the foundation for user-centric scenario generation
     * - Contains complete API specification for understanding user capabilities
     * - Provides schema constraints for realistic user data generation
     * - Defines authentication and permission requirements for user context
     *
     * ## User Scenario Context
     *
     * This endpoint information enables generation of scenarios that consider:
     *
     * - What users can realistically accomplish with this endpoint
     * - How users would naturally interact with the API functionality
     * - What business value users seek from this endpoint
     * - What constraints and limitations users will encounter
     * - How authentication affects user access patterns
     * - What data formats users need to provide or expect to receive
     *
     * ## Single Endpoint Constraint
     *
     * Each scenario generated must interact with ONLY this endpoint. Scenarios
     * should not assume or require calls to other endpoints, ensuring each user
     * journey is complete and testable in isolation.
     */
    endpoint: AutoBeOpenApi.IEndpoint;

    /**
     * Comprehensive collection of user-centric scenarios for the endpoint.
     *
     * Each scenario represents a realistic user journey, intention, or
     * situation when interacting with this specific API endpoint. All scenarios
     * are written from the user's perspective, focusing on what they want to
     * achieve and how they naturally interact with the API functionality.
     *
     * ## Scenario Coverage Framework
     *
     * The scenarios must comprehensively cover all user interaction patterns:
     *
     * ### 1. Happy Path User Journeys
     *
     * - Primary business use cases that users commonly perform
     * - Standard workflows leading to successful user outcomes
     * - Typical user behaviors with valid inputs and proper permissions
     * - Most frequent user intentions and expected interactions
     *
     * ### 2. Alternative User Approaches
     *
     * - Valid alternative ways users might achieve their goals
     * - User scenarios utilizing optional parameters or different input patterns
     * - Less common but legitimate user behaviors within normal boundaries
     * - User experimentation with available API features
     *
     * ### 3. User Error Situations
     *
     * - Natural user mistakes with input data (incorrect formats, missing fields)
     * - User attempts without proper authentication or authorization
     * - User actions that violate business rules or constraints
     * - User encounters with system limitations (rate limits, quotas)
     *
     * ### 4. Boundary User Behaviors
     *
     * - User attempts with extreme values (minimum/maximum limits)
     * - User submissions with empty, null, or unusual data
     * - User inputs with special characters, long strings, or edge cases
     * - User interactions testing system boundaries
     *
     * ### 5. Contextual User Situations
     *
     * - User interactions when resources exist vs. don't exist
     * - Different user roles attempting the same actions
     * - Time-sensitive user scenarios (expired sessions, scheduled operations)
     * - User attempts during various system states
     *
     * ## User-Centric Quality Standards
     *
     * Each scenario must:
     *
     * - Focus entirely on user motivation, context, and expected outcomes
     * - Describe realistic business situations users actually encounter
     * - Include clear user intent and the value they seek
     * - Specify user-provided data and user-expected results
     * - Be complete within the single endpoint constraint
     * - Provide sufficient context for understanding user behavior patterns
     * - Avoid technical implementation details or testing terminology
     *
     * ## Single Endpoint Constraint Application
     *
     * Every scenario must:
     *
     * - Complete the entire user journey using only this one endpoint
     * - Not depend on or reference other API endpoints
     * - Include all necessary context within the scenario itself
     * - Represent a complete, self-contained user interaction
     *
     * ## Business Value Focus
     *
     * These user scenarios ensure:
     *
     * - Understanding of real user needs and behaviors
     * - Comprehensive coverage of user interaction patterns
     * - Proper handling of user errors and edge cases
     * - Appropriate user feedback and experience design
     * - Business rule validation from user perspective
     * - Security and permission handling for different user contexts
     *
     * @example
     *   For a user profile creation endpoint, scenarios include:
     *   - "New user wants to create a complete profile with all personal information"
     *   - "User attempts to create profile with only required minimum information"
     *   - "User tries to create profile with email address that's already taken"
     *   - "User submits profile creation form with invalid email format"
     *   - "Unauthorized user attempts to create a profile without proper permissions"
     *   - "User enters extremely long name that exceeds system limits"
     */
    scenarios: Scenario[];
  }

  export interface Scenario {
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
     * Comprehensive user scenario description written from pure user
     * perspective.
     *
     * This describes a complete user journey, motivation, and expected outcome
     * when interacting with the API endpoint. The description focuses entirely
     * on user intent, context, and natural behavior patterns rather than
     * technical testing considerations.
     *
     * ## User-Centric Writing Approach
     *
     * - Write as if describing a real person's experience and motivation
     * - Focus on business context and user goals, not system functionality
     * - Use natural language that business stakeholders would understand
     * - Emphasize user value and expected benefits
     * - Avoid technical terminology or implementation details
     *
     * ## Required Content Elements
     *
     * Each scenario description must include:
     *
     * ### 1. User Context and Motivation
     *
     * - Who is the user (role, background, current situation)
     * - Why they need to perform this action (business motivation)
     * - What problem they're trying to solve or goal they want to achieve
     * - Any relevant background circumstances or constraints
     *
     * ### 2. User Actions and Behavior
     *
     * - Specific steps the user takes to accomplish their goal
     * - What information or data the user provides
     * - How the user naturally approaches the interaction
     * - Any decision-making process the user goes through
     *
     * ### 3. User Expectations and Desired Outcomes
     *
     * - What the user expects to happen as a result
     * - How the user will know if they were successful
     * - What value or benefit the user expects to receive
     * - How this fits into their broader workflow or objectives
     *
     * ### 4. Business Impact and Value
     *
     * - How this scenario relates to business objectives
     * - What business processes or workflows this supports
     * - Why this user behavior matters to the organization
     * - What risks or opportunities this scenario represents
     *
     * ## Single Endpoint Constraint Integration
     *
     * Each scenario must:
     *
     * - Represent a complete user journey achievable through this single endpoint
     * - Include all necessary context without referencing other API operations
     * - Describe user expectations based solely on this endpoint's capabilities
     * - Avoid scenarios that would logically require multiple API calls
     *
     * ## Quality and Realism Standards
     *
     * - Base scenarios on realistic business situations
     * - Include specific, concrete details rather than generic descriptions
     * - Ensure scenarios reflect actual user behaviors and motivations
     * - Make each scenario distinct and valuable for understanding user needs
     * - Provide enough detail to understand full context without being verbose
     *
     * ## User-Focused Example Scenarios
     *
     * - "A busy project manager needs to quickly create a new team member's user
     *   account during an onboarding meeting. They have all the necessary
     *   information readily available and expect the account to be immediately
     *   active so the new employee can start working right away."
     * - "A customer support representative is helping a customer who forgot their
     *   login credentials. The customer provides their email address, and the
     *   representative expects to quickly retrieve the associated account
     *   information to assist with password recovery."
     * - "A system administrator discovers that a former employee's account is
     *   still active after their departure. They need to immediately deactivate
     *   this account for security purposes and expect confirmation that the
     *   account can no longer be used to access company resources."
     *
     * ## Language and Tone
     *
     * - Use active voice and present tense when describing user actions
     * - Write in a narrative style that tells the user's story
     * - Balance professional tone with human context
     * - Ensure accessibility for both technical and non-technical readers
     * - Maintain consistency in perspective throughout the description
     */
    scenario: string;

    /** Collection of API endpoints that this scenario interacts with. */
    endpoints: AutoBeOpenApi.IEndpoint[];
  }
}
