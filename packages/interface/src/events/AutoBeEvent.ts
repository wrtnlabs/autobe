import { AutoBeAnalyzeReviewEvent } from "./AutoBEAnalyzeReviewEvent";
import { AutoBeAnalyzeCompleteEvent } from "./AutoBeAnalyzeCompleteEvent";
import { AutoBeAnalyzeStartEvent } from "./AutoBeAnalyzeStartEvent";
import { AutoBeAnalyzeWriteDocumentEvent } from "./AutoBeAnalyzeWriteDocumentEvent";
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
import { AutoBeRealizeProgressEvent } from "./AutoBeRealizeProgressEvent";
import { AutoBeRealizeStartEvent } from "./AutoBeRealizeStartEvent";
import { AutoBeRealizeValidateEvent } from "./AutoBeRealizeValidateEvent";
import { AutoBeTestCompleteEvent } from "./AutoBeTestCompleteEvent";
import { AutoBeTestCorrectEvent } from "./AutoBeTestCorrectEvent";
import { AutoBeTestProgressEvent } from "./AutoBeTestProgressEvent";
import { AutoBeTestScenarioEvent } from "./AutoBeTestScenarioEvent";
import { AutoBeTestStartEvent } from "./AutoBeTestStartEvent";
import { AutoBeTestValidateEvent } from "./AutoBeTestValidateEvent";
import { AutoBeUserMessageEvent } from "./AutoBeUserMessageEvent";

export type AutoBeEvent =
  | AutoBeAssistantMessageEvent
  | AutoBeUserMessageEvent
  | AutoBeAnalyzeStartEvent
  | AutoBeAnalyzeWriteDocumentEvent
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
  | AutoBeTestProgressEvent
  | AutoBeTestValidateEvent
  | AutoBeTestCorrectEvent
  | AutoBeTestCompleteEvent
  | AutoBeRealizeStartEvent
  | AutoBeRealizeProgressEvent
  | AutoBeRealizeValidateEvent
  | AutoBeRealizeCompleteEvent;
export namespace AutoBeEvent {
  export type Type = AutoBeEvent["type"];
  export interface Mapper {
    assistantMessage: AutoBeAssistantMessageEvent;
    userMessage: AutoBeUserMessageEvent;
    analyzeStart: AutoBeAnalyzeStartEvent;
    analyzeWriteDocument: AutoBeAnalyzeWriteDocumentEvent;
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
    testProgress: AutoBeTestProgressEvent;
    testValidate: AutoBeTestValidateEvent;
    testCorrect: AutoBeTestCorrectEvent;
    testComplete: AutoBeTestCompleteEvent;
    realizeStart: AutoBeRealizeStartEvent;
    realizeProgress: AutoBeRealizeProgressEvent;
    realizeValidate: AutoBeRealizeValidateEvent;
    realizeComplete: AutoBeRealizeCompleteEvent;
  }
}
