import { AutoBeAnalyzeCompleteEvent } from "./AutoBeAnalyzeCompleteEvent";
import { AutoBeAnalyzeReviewEvent } from "./AutoBeAnalyzeReviewEvent";
import { AutoBeAnalyzeStartEvent } from "./AutoBeAnalyzeStartEvent";
import { AutoBeAnalyzeWriteEvent } from "./AutoBeAnalyzeWriteEvent";
import { AutoBeAssistantMessageEvent } from "./AutoBeAssistantMessageEvent";
import { AutoBeInterfaceComplementEvent } from "./AutoBeInterfaceComplementEvent";
import { AutoBeInterfaceCompleteEvent } from "./AutoBeInterfaceCompleteEvent";
import { AutoBeInterfaceComponentsEvent } from "./AutoBeInterfaceComponentsEvent";
import { AutoBeInterfaceEndpointsEvent } from "./AutoBeInterfaceEndpointsEvent";
import { AutoBeInterfaceOperationsEvent } from "./AutoBeInterfaceOperationsEvent";
import { AutoBeInterfaceStartEvent } from "./AutoBeInterfaceStartEvent";
import { AutoBePrismaCompleteEvent } from "./AutoBePrismaCompleteEvent";
import { AutoBePrismaComponentsEvent } from "./AutoBePrismaComponentsEvent";
import { AutoBePrismaCorrectEvent } from "./AutoBePrismaCorrectEvent";
import { AutoBePrismaSchemasEvent } from "./AutoBePrismaSchemasEvent";
import { AutoBePrismaStartEvent } from "./AutoBePrismaStartEvent";
import { AutoBePrismaValidateEvent } from "./AutoBePrismaValidateEvent";
import { AutoBeRealizeCompleteEvent } from "./AutoBeRealizeCompleteEvent";
import { AutoBeRealizeIntegratorEvent } from "./AutoBeRealizeIntegratorEvent";
import { AutoBeRealizeProgressEvent } from "./AutoBeRealizeProgressEvent";
import { AutoBeRealizeStartEvent } from "./AutoBeRealizeStartEvent";
import { AutoBeRealizeValidateEvent } from "./AutoBeRealizeValidateEvent";
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
  | AutoBeAnalyzeStartEvent
  | AutoBeAnalyzeWriteEvent
  | AutoBeAnalyzeReviewEvent
  | AutoBeAnalyzeCompleteEvent
  | AutoBeInterfaceStartEvent
  | AutoBeInterfaceEndpointsEvent
  | AutoBeInterfaceOperationsEvent
  | AutoBeInterfaceComponentsEvent
  | AutoBeInterfaceComplementEvent
  | AutoBeInterfaceCompleteEvent
  | AutoBePrismaStartEvent
  | AutoBePrismaComponentsEvent
  | AutoBePrismaSchemasEvent
  | AutoBePrismaCompleteEvent
  | AutoBePrismaValidateEvent
  | AutoBePrismaCorrectEvent
  | AutoBeTestStartEvent
  | AutoBeTestScenarioEvent
  | AutoBeTestWriteEvent
  | AutoBeTestValidateEvent
  | AutoBeTestCorrectEvent
  | AutoBeTestCompleteEvent
  | AutoBeRealizeStartEvent
  | AutoBeRealizeProgressEvent
  | AutoBeRealizeIntegratorEvent
  | AutoBeRealizeValidateEvent
  | AutoBeRealizeCompleteEvent;

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
  export interface Mapper {
    assistantMessage: AutoBeAssistantMessageEvent;
    userMessage: AutoBeUserMessageEvent;
    analyzeStart: AutoBeAnalyzeStartEvent;
    analyzeWrite: AutoBeAnalyzeWriteEvent;
    analyzeReview: AutoBeAnalyzeReviewEvent;
    analyzeComplete: AutoBeAnalyzeCompleteEvent;
    prismaStart: AutoBePrismaStartEvent;
    prismaComponents: AutoBePrismaComponentsEvent;
    prismaSchemas: AutoBePrismaSchemasEvent;
    prismaComplete: AutoBePrismaCompleteEvent;
    prismaValidate: AutoBePrismaValidateEvent;
    prismaCorrect: AutoBePrismaCorrectEvent;
    interfaceStart: AutoBeInterfaceStartEvent;
    interfaceEndpoints: AutoBeInterfaceEndpointsEvent;
    interfaceOperations: AutoBeInterfaceOperationsEvent;
    interfaceComponents: AutoBeInterfaceComponentsEvent;
    interfaceComplement: AutoBeInterfaceComplementEvent;
    interfaceComplete: AutoBeInterfaceCompleteEvent;
    testStart: AutoBeTestStartEvent;
    testScenario: AutoBeTestScenarioEvent;
    testWrite: AutoBeTestWriteEvent;
    testValidate: AutoBeTestValidateEvent;
    testCorrect: AutoBeTestCorrectEvent;
    testComplete: AutoBeTestCompleteEvent;
    realizeStart: AutoBeRealizeStartEvent;
    realizeProgress: AutoBeRealizeProgressEvent;
    realizeIntegrator: AutoBeRealizeIntegratorEvent;
    realizeValidate: AutoBeRealizeValidateEvent;
    realizeComplete: AutoBeRealizeCompleteEvent;
  }
}
