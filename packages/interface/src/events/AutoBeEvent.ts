import { AutoBeAnalyzeCompleteEvent } from "./AutoBeAnalyzeCompleteEvent";
import { AutoBeAnalyzeReviewEvent } from "./AutoBeAnalyzeReviewEvent";
import { AutoBeAnalyzeScenarioEvent } from "./AutoBeAnalyzeScenarioEvent";
import { AutoBeAnalyzeStartEvent } from "./AutoBeAnalyzeStartEvent";
import { AutoBeAnalyzeWriteEvent } from "./AutoBeAnalyzeWriteEvent";
import { AutoBeAssistantMessageEvent } from "./AutoBeAssistantMessageEvent";
import { AutoBeInterfaceAuthorizationsEvent } from "./AutoBeInterfaceAuthorizationsEvent";
import { AutoBeInterfaceComplementEvent } from "./AutoBeInterfaceComplementEvent";
import { AutoBeInterfaceCompleteEvent } from "./AutoBeInterfaceCompleteEvent";
import { AutoBeInterfaceEndpointsEvent } from "./AutoBeInterfaceEndpointsEvent";
import { AutoBeInterfaceGroupsEvent } from "./AutoBeInterfaceGroupsEvent";
import { AutoBeInterfaceOperationsEvent } from "./AutoBeInterfaceOperationsEvent";
import { AutoBeInterfaceOperationsReviewEvent } from "./AutoBeInterfaceOperationsReviewEvent";
import { AutoBeInterfaceSchemasEvent } from "./AutoBeInterfaceSchemasEvent";
import { AutoBeInterfaceSchemasReviewEvent } from "./AutoBeInterfaceSchemasReviewEvent";
import { AutoBeInterfaceStartEvent } from "./AutoBeInterfaceStartEvent";
import { AutoBePrismaCompleteEvent } from "./AutoBePrismaCompleteEvent";
import { AutoBePrismaComponentsEvent } from "./AutoBePrismaComponentsEvent";
import { AutoBePrismaCorrectEvent } from "./AutoBePrismaCorrectEvent";
import { AutoBePrismaInsufficientEvent } from "./AutoBePrismaInsufficientEvent";
import { AutoBePrismaReviewEvent } from "./AutoBePrismaReviewEvent";
import { AutoBePrismaSchemasEvent } from "./AutoBePrismaSchemasEvent";
import { AutoBePrismaStartEvent } from "./AutoBePrismaStartEvent";
import { AutoBePrismaValidateEvent } from "./AutoBePrismaValidateEvent";
import { AutoBeRealizeAuthorizationCompleteEvent } from "./AutoBeRealizeAuthorizationCompleteEvent";
import { AutoBeRealizeAuthorizationCorrectEvent } from "./AutoBeRealizeAuthorizationCorrectEvent";
import { AutoBeRealizeAuthorizationStartEvent } from "./AutoBeRealizeAuthorizationStartEvent";
import { AutoBeRealizeAuthorizationValidateEvent } from "./AutoBeRealizeAuthorizationValidateEvent";
import { AutoBeRealizeAuthorizationWriteEvent } from "./AutoBeRealizeAuthorizationWriteEvent";
import { AutoBeRealizeCompleteEvent } from "./AutoBeRealizeCompleteEvent";
import { AutoBeRealizeCorrectEvent } from "./AutoBeRealizeCorrectEvent";
import { AutoBeRealizeStartEvent } from "./AutoBeRealizeStartEvent";
import { AutoBeRealizeTestCompleteEvent } from "./AutoBeRealizeTestCompleteEvent";
import { AutoBeRealizeTestOperationEvent } from "./AutoBeRealizeTestOperationEvent";
import { AutoBeRealizeTestResetEvent } from "./AutoBeRealizeTestResetEvent";
import { AutoBeRealizeTestStartEvent } from "./AutoBeRealizeTestStartEvent";
import { AutoBeRealizeValidateEvent } from "./AutoBeRealizeValidateEvent";
import { AutoBeRealizeWriteEvent } from "./AutoBeRealizeWriteEvent";
import { AutoBeTestCompleteEvent } from "./AutoBeTestCompleteEvent";
import { AutoBeTestCorrectEvent } from "./AutoBeTestCorrectEvent";
import { AutoBeTestScenarioEvent } from "./AutoBeTestScenarioEvent";
import { AutoBeTestStartEvent } from "./AutoBeTestStartEvent";
import { AutoBeTestValidateEvent } from "./AutoBeTestValidateEvent";
import { AutoBeTestWriteEvent } from "./AutoBeTestWriteEvent";
import { AutoBeUserMessageEvent } from "./AutoBeUserMessageEvent";

/**
 * Union type representing all possible events that can occur during the AutoBe
 * development pipeline execution.
 *
 * This comprehensive event system provides real-time visibility into every
 * stage of the automated development process, from initial requirements
 * analysis through final application generation. Each event type captures
 * specific moments in the pipeline workflow, enabling detailed monitoring,
 * progress tracking, and debugging capabilities.
 *
 * The events are organized by agent responsibility: conversation events for
 * user interaction, analyze events for requirements processing, interface
 * events for API specification generation, prisma events for database design,
 * test events for validation code creation, and realize events for final
 * application assembly.
 *
 * This event-driven architecture allows external systems to monitor pipeline
 * execution, implement custom logging, provide user feedback, or integrate with
 * other development tools by subscribing to specific event types.
 *
 * @author Samchon
 */
export type AutoBeEvent =
  | AutoBeAssistantMessageEvent
  | AutoBeUserMessageEvent
  // ANALYZE
  | AutoBeAnalyzeStartEvent
  | AutoBeAnalyzeScenarioEvent
  | AutoBeAnalyzeWriteEvent
  | AutoBeAnalyzeReviewEvent
  | AutoBeAnalyzeCompleteEvent
  // INTERFACE
  | AutoBeInterfaceStartEvent
  | AutoBeInterfaceGroupsEvent
  | AutoBeInterfaceEndpointsEvent
  | AutoBeInterfaceOperationsReviewEvent
  | AutoBeInterfaceOperationsEvent
  | AutoBeInterfaceAuthorizationsEvent
  | AutoBeInterfaceSchemasEvent
  | AutoBeInterfaceSchemasReviewEvent
  | AutoBeInterfaceComplementEvent
  | AutoBeInterfaceCompleteEvent
  // PRISMA
  | AutoBePrismaStartEvent
  | AutoBePrismaComponentsEvent
  | AutoBePrismaSchemasEvent
  | AutoBePrismaInsufficientEvent
  | AutoBePrismaReviewEvent
  | AutoBePrismaValidateEvent
  | AutoBePrismaCorrectEvent
  | AutoBePrismaCompleteEvent
  // TEST
  | AutoBeTestStartEvent
  | AutoBeTestScenarioEvent
  | AutoBeTestWriteEvent
  | AutoBeTestValidateEvent
  | AutoBeTestCorrectEvent
  | AutoBeTestCompleteEvent
  // REALIZE
  | AutoBeRealizeStartEvent
  | AutoBeRealizeWriteEvent
  | AutoBeRealizeCorrectEvent
  | AutoBeRealizeValidateEvent
  | AutoBeRealizeCompleteEvent
  | AutoBeRealizeAuthorizationStartEvent
  | AutoBeRealizeAuthorizationWriteEvent
  | AutoBeRealizeAuthorizationValidateEvent
  | AutoBeRealizeAuthorizationCorrectEvent
  | AutoBeRealizeAuthorizationCompleteEvent
  | AutoBeRealizeTestStartEvent
  | AutoBeRealizeTestResetEvent
  | AutoBeRealizeTestOperationEvent
  | AutoBeRealizeTestCompleteEvent;

export namespace AutoBeEvent {
  /**
   * Type literal union of all possible event type strings.
   *
   * Provides a compile-time enumeration of all event types that can occur
   * during pipeline execution. This type is extracted from the discriminant
   * union property of the AutoBeEvent type and is useful for type guards,
   * switch statements, and event filtering logic.
   *
   * The type enables type-safe event handling by ensuring that only valid event
   * type strings can be used when subscribing to events, filtering event
   * streams, or implementing event handlers.
   */
  export type Type = AutoBeEvent["type"];

  /**
   * Type mapping interface that associates event type strings with their
   * corresponding event object types.
   *
   * This mapping provides a type-safe way to access specific event types by
   * their string identifiers, enabling generic event handling patterns and
   * type-safe event subscription mechanisms. Each key represents an event type
   * string, and each value represents the complete event object type for that
   * event.
   *
   * The mapper is particularly useful for implementing event handlers that need
   * to process different event types with full type safety, allowing TypeScript
   * to provide accurate autocompletion and type checking for event-specific
   * properties and methods.
   *
   * Example usage patterns include event router implementations, type-safe
   * event subscription systems, and generic event processing utilities that
   * maintain compile-time type safety across different event types.
   */
  export type Mapper = {
    assistantMessage: AutoBeAssistantMessageEvent;
    userMessage: AutoBeUserMessageEvent;
    // ANALYZE
    analyzeStart: AutoBeAnalyzeStartEvent;
    analyzeScenario: AutoBeAnalyzeScenarioEvent;
    analyzeWrite: AutoBeAnalyzeWriteEvent;
    analyzeReview: AutoBeAnalyzeReviewEvent;
    analyzeComplete: AutoBeAnalyzeCompleteEvent;
    // PRISMA
    prismaStart: AutoBePrismaStartEvent;
    prismaComponents: AutoBePrismaComponentsEvent;
    prismaSchemas: AutoBePrismaSchemasEvent;
    prismaInsufficient: AutoBePrismaInsufficientEvent;
    prismaReview: AutoBePrismaReviewEvent;
    prismaValidate: AutoBePrismaValidateEvent;
    prismaCorrect: AutoBePrismaCorrectEvent;
    prismaComplete: AutoBePrismaCompleteEvent;
    // INTERFACE
    interfaceStart: AutoBeInterfaceStartEvent;
    interfaceGroups: AutoBeInterfaceGroupsEvent;
    interfaceEndpoints: AutoBeInterfaceEndpointsEvent;
    interfaceOperations: AutoBeInterfaceOperationsEvent;
    interfaceOperationsReview: AutoBeInterfaceOperationsReviewEvent;
    interfaceAuthorizations: AutoBeInterfaceAuthorizationsEvent;
    interfaceSchemas: AutoBeInterfaceSchemasEvent;
    interfaceSchemasReview: AutoBeInterfaceSchemasReviewEvent;
    interfaceComplement: AutoBeInterfaceComplementEvent;
    interfaceComplete: AutoBeInterfaceCompleteEvent;
    // TEST
    testStart: AutoBeTestStartEvent;
    testScenario: AutoBeTestScenarioEvent;
    testWrite: AutoBeTestWriteEvent;
    testValidate: AutoBeTestValidateEvent;
    testCorrect: AutoBeTestCorrectEvent;
    testComplete: AutoBeTestCompleteEvent;
    // REALIZE
    realizeStart: AutoBeRealizeStartEvent;
    realizeWrite: AutoBeRealizeWriteEvent;
    realizeCorrect: AutoBeRealizeCorrectEvent;
    realizeValidate: AutoBeRealizeValidateEvent;
    realizeComplete: AutoBeRealizeCompleteEvent;
    realizeAuthorizationStart: AutoBeRealizeAuthorizationStartEvent;
    realizeAuthorizationWrite: AutoBeRealizeAuthorizationWriteEvent;
    realizeAuthorizationValidate: AutoBeRealizeAuthorizationValidateEvent;
    realizeAuthorizationCorrect: AutoBeRealizeAuthorizationCorrectEvent;
    realizeAuthorizationComplete: AutoBeRealizeAuthorizationCompleteEvent;
    realizeTestStart: AutoBeRealizeTestStartEvent;
    realizeTestReset: AutoBeRealizeTestResetEvent;
    realizeTestOperation: AutoBeRealizeTestOperationEvent;
    realizeTestComplete: AutoBeRealizeTestCompleteEvent;
  };
}
