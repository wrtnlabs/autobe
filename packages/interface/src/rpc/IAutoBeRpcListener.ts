import {
  AutoBeAnalyzeCompleteEvent,
  AutoBeAnalyzeReviewEvent,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeStartEvent,
  AutoBeAnalyzeWriteEvent,
  AutoBeAssistantMessageEvent,
  AutoBeDatabaseCompleteEvent,
  AutoBeDatabaseComponentEvent,
  AutoBeDatabaseComponentReviewEvent,
  AutoBeDatabaseCorrectEvent,
  AutoBeDatabaseGroupEvent,
  AutoBeDatabaseSchemaEvent,
  AutoBeDatabaseSchemaReviewEvent,
  AutoBeDatabaseStartEvent,
  AutoBeDatabaseValidateEvent,
  AutoBeImageDescribeCompleteEvent,
  AutoBeImageDescribeDraftEvent,
  AutoBeImageDescribeStartEvent,
  AutoBeInterfaceCompleteEvent,
  AutoBeInterfaceEndpointEvent,
  AutoBeInterfaceOperationEvent,
  AutoBeInterfaceOperationReviewEvent,
  AutoBeInterfaceSchemaComplementEvent,
  AutoBeInterfaceSchemaEvent,
  AutoBeInterfaceSchemaRenameEvent,
  AutoBeInterfaceStartEvent,
  AutoBeRealizeAuthorizationCorrectEvent,
  AutoBeRealizeAuthorizationValidateEvent,
  AutoBeRealizeAuthorizationWriteEvent,
  AutoBeRealizeCompleteEvent,
  AutoBeRealizeCorrectEvent,
  AutoBeRealizePlanEvent,
  AutoBeRealizeStartEvent,
  AutoBeRealizeTestCompleteEvent,
  AutoBeRealizeTestOperationEvent,
  AutoBeRealizeTestResetEvent,
  AutoBeRealizeTestStartEvent,
  AutoBeRealizeValidateEvent,
  AutoBeRealizeWriteEvent,
  AutoBeTestCompleteEvent,
  AutoBeTestCorrectEvent,
  AutoBeTestScenarioEvent,
  AutoBeTestScenarioReviewEvent,
  AutoBeTestStartEvent,
  AutoBeTestValidateEvent,
  AutoBeTestWriteEvent,
  AutoBeUserMessageEvent,
} from "../events";
import { AutoBeInterfaceAuthorizationEvent } from "../events/AutoBeInterfaceAuthorizationEvent";
import { AutoBeInterfaceEndpointReviewEvent } from "../events/AutoBeInterfaceEndpointReviewEvent";
import { AutoBeInterfaceGroupEvent } from "../events/AutoBeInterfaceGroupEvent";
import { AutoBeInterfacePrerequisiteEvent } from "../events/AutoBeInterfacePrerequisiteEvent";
import { AutoBeRealizeAuthorizationCompleteEvent } from "../events/AutoBeRealizeAuthorizationCompleteEvent";
import { AutoBeRealizeAuthorizationStartEvent } from "../events/AutoBeRealizeAuthorizationStartEvent";

/**
 * Interface for WebSocket RPC event listener provided by client applications to
 * receive real-time events from the vibe coding server.
 *
 * This interface defines the event handling contract for client applications
 * that connect to the vibe coding WebSocket server. Client applications provide
 * an implementation of this interface to receive real-time notifications about
 * conversation flow, development progress, and completion events throughout the
 * automated development pipeline.
 *
 * The listener functions enable client applications to provide interactive user
 * experiences, display progress indicators, handle development artifacts, and
 * respond to the dynamic nature of the vibe coding process. Only
 * {@link assistantMessage} and completion events are mandatory, while progress
 * events are optional but recommended for enhanced user experience.
 *
 * @author Samchon
 */
export interface IAutoBeRpcListener {
  /* -----------------------------------------------------------
    MESSAGES
  ----------------------------------------------------------- */
  /**
   * Mandatory handler for assistant message events during conversation flow.
   *
   * Called when the AI assistant sends messages to the user, providing
   * responses, explanations, progress updates, and guidance throughout the vibe
   * coding workflow. This is a core communication channel that keeps users
   * informed about ongoing activities and system responses.
   */
  assistantMessage(event: AutoBeAssistantMessageEvent): Promise<void>;

  /**
   * Optional handler for user message events during conversation flow.
   *
   * Called when user messages are processed, allowing client applications to
   * track conversation history and provide enhanced user interface features
   * such as message confirmation or conversation replay capabilities.
   */
  userMessage?(event: AutoBeUserMessageEvent): Promise<void>;

  /**
   * Whether to enable or disable conversation.
   *
   * If disabled (`value := false`), you cannot call the
   * {@link IAutoBeRpcServer.conversate} method until you receive the next
   * {@link enable} function call with `true` value.
   *
   * @param value `true` to enable conversation, `false` to disable.
   */
  enable(value: boolean): Promise<void>;

  /* -----------------------------------------------------------
    DESCRIBE IMAGE EVENTS
  ----------------------------------------------------------- */
  /**
   * Optional handler for describe image start events.
   *
   * Called when the Describe agent begins the image analysis and planning
   * document generation process, enabling client applications to show describe
   * image initiation and prepare progress indicators for visual
   * interpretation.
   */
  imageDescribeStart?(event: AutoBeImageDescribeStartEvent): Promise<void>;

  /**
   * Optional handler for image draft generation events.
   *
   * Called when the Describe agent analyzes batches of UI screenshots, mockups,
   * or design documents and generates planning drafts. Each event represents
   * analysis of a batch of images with extracted requirements and metadata.
   */
  imageDescribeDraft?(event: AutoBeImageDescribeDraftEvent): Promise<void>;

  /**
   * Mandatory handler for describe image completion events.
   *
   * Called when the describe image completes successfully, providing the
   * finalized planning documentation generated from image analysis that can be
   * used as input for the analyze agent.
   */
  imageDescribeComplete?(
    event: AutoBeImageDescribeCompleteEvent,
  ): Promise<void>;

  /* -----------------------------------------------------------
    ANALYZE PHASE EVENTS
  ----------------------------------------------------------- */
  /**
   * Optional handler for requirements analysis start events.
   *
   * Called when the Analyze agent begins drafting the requirements analysis,
   * enabling client applications to show analysis phase initiation and prepare
   * progress indicators for the requirements documentation process.
   */
  analyzeStart?(event: AutoBeAnalyzeStartEvent): Promise<void>;

  /**
   * Optional handler for requirements analysis compose events.
   *
   * Occurs when an agent is called that generates metadata for the analysis,
   * such as the table of contents, role, number of pages, and so on.
   */
  analyzeScenario?(event: AutoBeAnalyzeScenarioEvent): Promise<void>;

  /**
   * Optional handler for requirements analysis writing progress events.
   *
   * Called during the writing phase as analysis documents are being created,
   * allowing client applications to display real-time progress and provide
   * visibility into the document generation process.
   */
  analyzeWrite?(event: AutoBeAnalyzeWriteEvent): Promise<void>;

  /**
   * Optional handler for requirements analysis review events.
   *
   * Called during the review and amendment phase, enabling client applications
   * to show that requirements are being refined and improved based on feedback
   * and additional analysis.
   */
  analyzeReview?(event: AutoBeAnalyzeReviewEvent): Promise<void>;

  /**
   * Mandatory handler for requirements analysis completion events.
   *
   * Called when the analysis phase completes successfully, providing the
   * finalized requirements documentation that serves as the foundation for all
   * subsequent development phases. Client applications must handle this event
   * to receive the completed analysis artifacts.
   */
  analyzeComplete?(event: AutoBeAnalyzeCompleteEvent): Promise<void>;

  /* -----------------------------------------------------------
    DATABASE PHASE EVENTS
  ----------------------------------------------------------- */
  /**
   * Optional handler for database design start events.
   *
   * Called when the Database agent begins database schema design, enabling
   * client applications to indicate the start of data architecture development
   * and prepare progress tracking for the database design phase.
   */
  databaseStart?(event: AutoBeDatabaseStartEvent): Promise<void>;

  databaseGroup?(event: AutoBeDatabaseGroupEvent): Promise<void>;

  /**
   * Optional handler for database component organization events.
   *
   * Called when tables are organized into categorized groups by business
   * domain, allowing client applications to display the structural planning of
   * the database architecture and show progress scope.
   */
  databaseComponent?(event: AutoBeDatabaseComponentEvent): Promise<void>;

  /**
   * Optional handler for database component review events.
   *
   * Called when the Database agent reviews and validates the component
   * organization during the database design process.
   */
  databaseComponentReview?(
    event: AutoBeDatabaseComponentReviewEvent,
  ): Promise<void>;

  /**
   * Optional handler for database schema creation progress events.
   *
   * Called each time a domain-specific schema file is completed, enabling
   * client applications to track incremental progress and show which business
   * areas have been fully designed.
   */
  databaseSchema?(event: AutoBeDatabaseSchemaEvent): Promise<void>;

  /**
   * Optional handler for database schema review events.
   *
   * Called when the Database agent reviews and validates schema modifications,
   * enabling client applications to show that the database design is being
   * thoroughly evaluated against best practices and business requirements.
   *
   * Client applications can use this event to display the review findings,
   * highlight any necessary modifications, and confirm that the schema adheres
   * to normalization principles, relationship integrity, and performance
   * optimization.
   *
   * The review process ensures that the database design is robust, maintains
   * data integrity, and aligns with the overall project goals and
   * requirements.
   */
  databaseSchemaReview?(event: AutoBeDatabaseSchemaReviewEvent): Promise<void>;

  /**
   * Optional handler for database schema validation events.
   *
   * Called when validation failures occur during schema compilation, allowing
   * client applications to inform users about quality assurance processes and
   * potential correction activities.
   */
  databaseValidate?(event: AutoBeDatabaseValidateEvent): Promise<void>;

  /**
   * Optional handler for database schema correction events.
   *
   * Called when the AI self-correction process addresses validation failures,
   * enabling client applications to show that issues are being resolved
   * automatically through the feedback loop mechanism.
   */
  databaseCorrect?(event: AutoBeDatabaseCorrectEvent): Promise<void>;

  /**
   * Mandatory handler for database design completion events.
   *
   * Called when the Database phase completes successfully, providing the
   * validated database schemas and compilation results. Client applications
   * must handle this event to receive the completed database artifacts.
   */
  databaseComplete?(event: AutoBeDatabaseCompleteEvent): Promise<void>;

  /* -----------------------------------------------------------
    INTERFACE PHASE EVENTS
  ----------------------------------------------------------- */
  /**
   * Optional handler for API design start events.
   *
   * Called when the Interface agent begins RESTful API specification design,
   * enabling client applications to indicate the start of API development and
   * prepare progress tracking for the interface design phase.
   */
  interfaceStart?(event: AutoBeInterfaceStartEvent): Promise<void>;

  /**
   * Optional handler for API interface group creation events.
   *
   * Called when the Interface agent generates groups of API endpoints based on
   * the organized database schemas, enabling client applications to show the
   * initial scope of API surface area being designed and track progress in the
   * interface design phase.
   *
   * @param event The event containing the created interface groups.
   */
  interfaceGroup?(event: AutoBeInterfaceGroupEvent): Promise<void>;

  /**
   * Optional handler for API endpoint creation events.
   *
   * Called when the complete list of API endpoints is established, allowing
   * client applications to show the API surface area scope and architectural
   * foundation being built.
   */
  interfaceEndpoint?(event: AutoBeInterfaceEndpointEvent): Promise<void>;

  /**
   * Optional handler for API endpoint review events.
   *
   * Called when the Interface agent reviews API endpoints, enabling client
   * applications to show the review process and any identified issues.
   */
  interfaceEndpointReview?(
    event: AutoBeInterfaceEndpointReviewEvent,
  ): Promise<void>;

  /**
   * Optional handler for API operation definition progress events.
   *
   * Called as detailed operation specifications are created for each endpoint,
   * enabling client applications to track progress and show how API
   * functionality is being systematically developed.
   */
  interfaceOperation?(event: AutoBeInterfaceOperationEvent): Promise<void>;

  /**
   * Optional handler for API operation review events.
   *
   * Called when the Interface agent reviews API operations, enabling client
   * applications to show the review process and any identified issues.
   */
  interfaceOperationReview?(
    event: AutoBeInterfaceOperationReviewEvent,
  ): Promise<void>;

  /**
   * Optional handler for API authorization operation definition progress
   * events.
   *
   * Called as detailed authorization operation specifications are created for
   * each endpoint, enabling client applications to track progress and show how
   * API authorization is being systematically developed.
   */
  interfaceAuthorization?(
    event: AutoBeInterfaceAuthorizationEvent,
  ): Promise<void>;

  /**
   * Optional handler for API component schema creation events.
   *
   * Called when reusable schema components are being defined, allowing client
   * applications to show progress in type definition and data structure
   * development for the API specification.
   */
  interfaceSchema?(event: AutoBeInterfaceSchemaEvent): Promise<void>;

  interfaceSchemaRefine?(event: AutoBeInterfaceSchemaEvent): Promise<void>;

  interfaceSchemaReview?(event: AutoBeInterfaceSchemaEvent): Promise<void>;

  /**
   * Optional handler for API schema rename events.
   *
   * Called when the Interface agent detects and corrects DTO type names that
   * violate the critical naming convention: ALL words from the database table
   * name MUST be preserved in the DTO type name. This enables client
   * applications to show that naming consistency is being enforced to maintain
   * type-to-table traceability.
   *
   * The rename agent detects violations such as:
   *
   * - Service prefix omission: `ISale` should be `IShoppingSale`
   * - Intermediate word omission: `IBbsComment` should be `IBbsArticleComment`
   * - Multiple words omitted: `IShoppingRefund` should be
   *   `IShoppingOrderGoodRefund`
   *
   * Refactorings are automatically applied to base types, all variants
   * (.ICreate, .IUpdate, .ISummary), page types (IPageISale), and all $ref
   * references throughout the OpenAPI document.
   */
  interfaceSchemaRename?(
    event: AutoBeInterfaceSchemaRenameEvent,
  ): Promise<void>;

  /**
   * Optional handler for API schema complement events.
   *
   * Called when missing schemas are identified and added to complete the
   * specification, enabling client applications to show that gaps are being
   * filled to ensure comprehensive API coverage.
   */
  interfaceSchemaComplement?(
    event: AutoBeInterfaceSchemaComplementEvent,
  ): Promise<void>;

  /**
   * Mandatory handler for API design completion events.
   *
   * Called when the Interface phase completes successfully, providing the
   * complete OpenAPI specification and generated NestJS application files.
   * Client applications must handle this event to receive the completed API
   * artifacts.
   */
  interfaceComplete?(event: AutoBeInterfaceCompleteEvent): Promise<void>;

  /**
   * Optional handler for API prerequisite creation events.
   *
   * Called when the Interface agent creates prerequisites for API operations,
   * enabling client applications to show the progress of prerequisite creation
   * and track which operations are being analyzed.
   */
  interfacePrerequisite?(
    event: AutoBeInterfacePrerequisiteEvent,
  ): Promise<void>;

  /* -----------------------------------------------------------
    TEST PHASE EVENTS
  ----------------------------------------------------------- */
  /**
   * Optional handler for test suite generation start events.
   *
   * Called when the Test agent begins creating e2e test scenarios, enabling
   * client applications to indicate the start of test development and prepare
   * progress tracking for comprehensive validation coverage.
   */
  testStart?(event: AutoBeTestStartEvent): Promise<void>;

  /**
   * Optional handler for test scenario planning events.
   *
   * Called when test scenarios are being planned and organized, allowing client
   * applications to show the scope of validation coverage being designed for
   * the application.
   */
  testScenario?(event: AutoBeTestScenarioEvent): Promise<void>;

  /**
   * Optional handler for test scenario review events.
   *
   * Called when test scenarios are being reviewed, allowing client applications
   * to show the review process and any identified issues.
   */
  testScenarioReview?(event: AutoBeTestScenarioReviewEvent): Promise<void>;

  /**
   * Optional handler for test code generation progress events.
   *
   * Called as individual test files are created, enabling client applications
   * to track incremental progress and show which API endpoints are being
   * validated through comprehensive test scenarios.
   */
  testWrite?(event: AutoBeTestWriteEvent): Promise<void>;

  /**
   * Optional handler for test code validation events.
   *
   * Called when test code undergoes TypeScript compilation validation, allowing
   * client applications to show quality assurance processes and potential
   * correction activities for test code.
   */
  testValidate?(event: AutoBeTestValidateEvent): Promise<void>;

  /**
   * Optional handler for test code correction events.
   *
   * Called when the AI self-correction process addresses compilation failures
   * in test code, enabling client applications to show that issues are being
   * resolved automatically through iterative improvement.
   */
  testCorrect?(event: AutoBeTestCorrectEvent): Promise<void>;

  /**
   * Mandatory handler for test suite completion events.
   *
   * Called when the Test phase completes successfully, providing the complete
   * test suite with comprehensive validation coverage. Client applications must
   * handle this event to receive the completed test artifacts.
   */
  testComplete?(event: AutoBeTestCompleteEvent): Promise<void>;

  /* -----------------------------------------------------------
    REALIZE PHASE EVENTS
  ----------------------------------------------------------- */
  /**
   * Optional handler for implementation start events.
   *
   * Called when the Realize agent begins implementing business logic and
   * service layer code, enabling client applications to indicate the start of
   * the final implementation phase.
   */
  realizeStart?(event: AutoBeRealizeStartEvent): Promise<void>;

  /**
   * Optional handler for authorization implementation start events.
   *
   * Called when the Realize agent begins implementing authentication and
   * authorization components, including providers, payloads, and decorators for
   * role-based access control.
   */
  realizeAuthorizationStart?(
    event: AutoBeRealizeAuthorizationStartEvent,
  ): Promise<void>;

  /**
   * Optional handler for authorization implementation progress events.
   *
   * Called when the Realize agent generates authorization components
   * (providers, payloads, decorators) for each user role, enabling client
   * applications to track the progress of authorization system implementation.
   */
  realizeAuthorizationWrite?(
    event: AutoBeRealizeAuthorizationWriteEvent,
  ): Promise<void>;

  /**
   * Optional handler for authorization validation events.
   *
   * Called when the Realize agent validates the generated authorization
   * components (providers, payloads, decorators), enabling client applications
   * to show quality assurance processes and potential correction activities for
   * the authentication and authorization system.
   */
  realizeAuthorizationValidate?(
    event: AutoBeRealizeAuthorizationValidateEvent,
  ): Promise<void>;

  /**
   * Optional handler for authorization correction events.
   *
   * Called when the Realize agent corrects compilation failures in the
   * generated authorization implementation code (providers, payloads,
   * decorators), enabling client applications to show that issues are being
   * resolved automatically through iterative improvement.
   */
  realizeAuthorizationCorrect?(
    event: AutoBeRealizeAuthorizationCorrectEvent,
  ): Promise<void>;

  /**
   * Optional handler for authorization implementation completion events.
   *
   * Called when the Realize agent completes the implementation of all
   * authorization components, signaling that the authentication and
   * authorization system is fully implemented and ready for use.
   */
  realizeAuthorizationComplete?(
    event: AutoBeRealizeAuthorizationCompleteEvent,
  ): Promise<void>;

  realizePlan?(event: AutoBeRealizePlanEvent): Promise<void>;

  /**
   * Optional handler for implementation progress events.
   *
   * Called as individual implementation files are created, enabling client
   * applications to track incremental progress and show how the complete
   * application functionality is being assembled.
   */
  realizeWrite?(event: AutoBeRealizeWriteEvent): Promise<void>;

  /**
   * Optional handler for implementation correction events.
   *
   * Called when the AI self-correction process addresses compilation or logic
   * errors in implementation code, allowing client applications to reflect that
   * backend logic is being automatically improved through iterative fixes.
   *
   * This enables real-time visibility into how faulty implementation files are
   * revised and finalized by the Realize agent to meet project standards.
   */
  realizeCorrect?(event: AutoBeRealizeCorrectEvent): Promise<void>;

  /**
   * Optional handler for implementation validation events.
   *
   * Called when implementation code undergoes compilation validation, allowing
   * client applications to show quality assurance processes and potential
   * correction activities for the final implementation.
   */
  realizeValidate?(event: AutoBeRealizeValidateEvent): Promise<void>;

  /**
   * Optional handler for implementation completion events.
   *
   * Called when the Realize phase completes successfully, providing the
   * complete working application implementation. Client applications must
   * handle this event to receive the final implementation artifacts that
   * represent the culmination of the entire vibe coding pipeline.
   */
  realizeComplete?(event: AutoBeRealizeCompleteEvent): Promise<void>;

  /**
   * Optional handler for implementation test start events.
   *
   * Called when the Realize agent begins running the test suite to validate the
   * generated implementation, enabling client applications to show that
   * comprehensive testing is beginning to ensure application quality and
   * functionality.
   */
  realizeTestStart?(event: AutoBeRealizeTestStartEvent): Promise<void>;

  /**
   * Optional handler for implementation test reset events.
   *
   * Called when the test environment is reset between test runs, allowing
   * client applications to show that clean testing conditions are being
   * established to ensure reliable and isolated test execution.
   */
  realizeTestReset?(event: AutoBeRealizeTestResetEvent): Promise<void>;

  /**
   * Optional handler for implementation test operation events.
   *
   * Called during individual test operation execution, enabling client
   * applications to provide detailed progress tracking and show which specific
   * API endpoints and business logic components are being validated through the
   * comprehensive test suite.
   */
  realizeTestOperation?(event: AutoBeRealizeTestOperationEvent): Promise<void>;

  /**
   * Optional handler for implementation test completion events.
   *
   * Called when the complete test suite execution finishes, providing test
   * results and validation outcomes. Client applications can use this event to
   * show final quality assurance results and confirm that the generated
   * application meets all specified requirements and passes comprehensive
   * validation.
   */
  realizeTestComplete?(event: AutoBeRealizeTestCompleteEvent): Promise<void>;
}
