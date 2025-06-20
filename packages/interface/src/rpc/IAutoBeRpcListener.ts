import {
  AutoBeAnalyzeCompleteEvent,
  AutoBeAnalyzeReviewEvent,
  AutoBeAnalyzeStartEvent,
  AutoBeAnalyzeWriteEvent,
  AutoBeAssistantMessageEvent,
  AutoBeInterfaceComplementEvent,
  AutoBeInterfaceCompleteEvent,
  AutoBeInterfaceComponentsEvent,
  AutoBeInterfaceEndpointsEvent,
  AutoBeInterfaceOperationsEvent,
  AutoBeInterfaceStartEvent,
  AutoBePrismaCompleteEvent,
  AutoBePrismaComponentsEvent,
  AutoBePrismaCorrectEvent,
  AutoBePrismaSchemasEvent,
  AutoBePrismaStartEvent,
  AutoBePrismaValidateEvent,
  AutoBeRealizeCompleteEvent,
  AutoBeRealizeProgressEvent,
  AutoBeRealizeStartEvent,
  AutoBeRealizeValidateEvent,
  AutoBeTestCompleteEvent,
  AutoBeTestCorrectEvent,
  AutoBeTestProgressEvent,
  AutoBeTestStartEvent,
  AutoBeTestValidateEvent,
  AutoBeUserMessageEvent,
} from "../events";
import { AutoBeTestScenarioEvent } from "../events/AutoBeTestScenarioEvent";

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
    PRISMA PHASE EVENTS
  ----------------------------------------------------------- */
  /**
   * Optional handler for database design start events.
   *
   * Called when the Prisma agent begins database schema design, enabling client
   * applications to indicate the start of data architecture development and
   * prepare progress tracking for the database design phase.
   */
  prismaStart?(event: AutoBePrismaStartEvent): Promise<void>;

  /**
   * Optional handler for database component organization events.
   *
   * Called when tables are organized into categorized groups by business
   * domain, allowing client applications to display the structural planning of
   * the database architecture and show progress scope.
   */
  prismaComponents?(event: AutoBePrismaComponentsEvent): Promise<void>;

  /**
   * Optional handler for database schema creation progress events.
   *
   * Called each time a domain-specific schema file is completed, enabling
   * client applications to track incremental progress and show which business
   * areas have been fully designed.
   */
  prismaSchemas?(event: AutoBePrismaSchemasEvent): Promise<void>;

  /**
   * Optional handler for database schema validation events.
   *
   * Called when validation failures occur during schema compilation, allowing
   * client applications to inform users about quality assurance processes and
   * potential correction activities.
   */
  prismaValidate?(event: AutoBePrismaValidateEvent): Promise<void>;

  /**
   * Optional handler for database schema correction events.
   *
   * Called when the AI self-correction process addresses validation failures,
   * enabling client applications to show that issues are being resolved
   * automatically through the feedback loop mechanism.
   */
  prismaCorrect?(event: AutoBePrismaCorrectEvent): Promise<void>;

  /**
   * Mandatory handler for database design completion events.
   *
   * Called when the Prisma phase completes successfully, providing the
   * validated database schemas and compilation results. Client applications
   * must handle this event to receive the completed database artifacts.
   */
  prismaComplete?(event: AutoBePrismaCompleteEvent): Promise<void>;

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
   * Optional handler for API endpoint creation events.
   *
   * Called when the complete list of API endpoints is established, allowing
   * client applications to show the API surface area scope and architectural
   * foundation being built.
   */
  interfaceEndpoints?(event: AutoBeInterfaceEndpointsEvent): Promise<void>;

  /**
   * Optional handler for API operation definition progress events.
   *
   * Called as detailed operation specifications are created for each endpoint,
   * enabling client applications to track progress and show how API
   * functionality is being systematically developed.
   */
  interfaceOperations?(event: AutoBeInterfaceOperationsEvent): Promise<void>;

  /**
   * Optional handler for API component schema creation events.
   *
   * Called when reusable schema components are being defined, allowing client
   * applications to show progress in type definition and data structure
   * development for the API specification.
   */
  interfaceComponents?(event: AutoBeInterfaceComponentsEvent): Promise<void>;

  /**
   * Optional handler for API schema complement events.
   *
   * Called when missing schemas are identified and added to complete the
   * specification, enabling client applications to show that gaps are being
   * filled to ensure comprehensive API coverage.
   */
  interfaceComplement?(event: AutoBeInterfaceComplementEvent): Promise<void>;

  /**
   * Mandatory handler for API design completion events.
   *
   * Called when the Interface phase completes successfully, providing the
   * complete OpenAPI specification and generated NestJS application files.
   * Client applications must handle this event to receive the completed API
   * artifacts.
   */
  interfaceComplete?(event: AutoBeInterfaceCompleteEvent): Promise<void>;

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
   * Optional handler for test code generation progress events.
   *
   * Called as individual test files are created, enabling client applications
   * to track incremental progress and show which API endpoints are being
   * validated through comprehensive test scenarios.
   */
  testProgress?(event: AutoBeTestProgressEvent): Promise<void>;

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
   * Optional handler for implementation progress events.
   *
   * Called as individual implementation files are created, enabling client
   * applications to track incremental progress and show how the complete
   * application functionality is being assembled.
   */
  realizeProgress?(event: AutoBeRealizeProgressEvent): Promise<void>;

  /**
   * Optional handler for implementation validation events.
   *
   * Called when implementation code undergoes compilation validation, allowing
   * client applications to show quality assurance processes and potential
   * correction activities for the final implementation.
   */
  realizeValidate?(event: AutoBeRealizeValidateEvent): Promise<void>;

  /**
   * Mandatory handler for implementation completion events.
   *
   * Called when the Realize phase completes successfully, providing the
   * complete working application implementation. Client applications must
   * handle this event to receive the final implementation artifacts that
   * represent the culmination of the entire vibe coding pipeline.
   */
  realizeComplete?(event: AutoBeRealizeCompleteEvent): Promise<void>;
}
