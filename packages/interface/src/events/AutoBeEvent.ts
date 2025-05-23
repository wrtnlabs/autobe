import { AutoBeAnalyzeCompleteEvent } from "./AutoBeAnalyzeCompleteEvent";
import { AutoBeAnalyzeStartEvent } from "./AutoBeAnalyzeStartEvent";
import { AutoBeAssistantMessageEvent } from "./AutoBeAssistantMessageEvent";
import { AutoBeInterfaceCompleteEvent } from "./AutoBeInterfaceCompleteEvent";
import { AutoBeInterfaceComponentsEvent } from "./AutoBeInterfaceComponentsEvent";
import { AutoBeInterfaceEndpointsEvent } from "./AutoBeInterfaceEndpointsEvent";
import { AutoBeInterfaceOperationsEvent } from "./AutoBeInterfaceOperationsEvent";
import { AutoBeInterfaceStartEvent } from "./AutoBeInterfaceStartEvent";
import { AutoBePrismaCompleteEvent } from "./AutoBePrismaCompleteEvent";
import { AutoBePrismaComponentsEvent } from "./AutoBePrismaComponentsEvent";
import { AutoBePrismaSchemasEvent } from "./AutoBePrismaSchemasEvent";
import { AutoBePrismaStartEvent } from "./AutoBePrismaStartEvent";
import { AutoBePrismaValidateEvent } from "./AutoBePrismaValidateEvent";
import { AutoBeRealizeCompleteEvent } from "./AutoBeRealizeCompleteEvent";
import { AutoBeRealizeProgressEvent } from "./AutoBeRealizeProgressEvent";
import { AutoBeRealizeStartEvent } from "./AutoBeRealizeStartEvent";
import { AutoBeRealizeValidateEvent } from "./AutoBeRealizeValidateEvent";
import { AutoBeTestCompleteEvent } from "./AutoBeTestCompleteEvent";
import { AutoBeTestProgressEvent } from "./AutoBeTestProgressEvent";
import { AutoBeTestStartEvent } from "./AutoBeTestStartEvent";
import { AutoBeTestValidateEvent } from "./AutoBeTestValidateEvent";
import { AutoBeUserMessageEvent } from "./AutoBeUserMessageEvent";

export type AutoBeEvent =
  | AutoBeAssistantMessageEvent
  | AutoBeUserMessageEvent
  | AutoBeAnalyzeStartEvent
  | AutoBeAnalyzeCompleteEvent
  | AutoBeInterfaceStartEvent
  | AutoBeInterfaceEndpointsEvent
  | AutoBeInterfaceOperationsEvent
  | AutoBeInterfaceComponentsEvent
  | AutoBeInterfaceCompleteEvent
  | AutoBePrismaStartEvent
  | AutoBePrismaComponentsEvent
  | AutoBePrismaSchemasEvent
  | AutoBePrismaCompleteEvent
  | AutoBePrismaValidateEvent
  | AutoBeTestStartEvent
  | AutoBeTestProgressEvent
  | AutoBeTestValidateEvent
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
    analyzeComplete: AutoBeAnalyzeCompleteEvent;
    prismaStart: AutoBePrismaStartEvent;
    prismaComponents: AutoBePrismaComponentsEvent;
    prismaSchemas: AutoBePrismaSchemasEvent;
    prismaComplete: AutoBePrismaCompleteEvent;
    prismaValidate: AutoBePrismaValidateEvent;
    interfaceStart: AutoBeInterfaceStartEvent;
    interfaceEndpoints: AutoBeInterfaceEndpointsEvent;
    interfaceOperations: AutoBeInterfaceOperationsEvent;
    interfaceComponents: AutoBeInterfaceComponentsEvent;
    interfaceComplete: AutoBeInterfaceCompleteEvent;
    testStart: AutoBeTestStartEvent;
    testProgress: AutoBeTestProgressEvent;
    testValidate: AutoBeTestValidateEvent;
    testComplete: AutoBeTestCompleteEvent;
    realizeStart: AutoBeRealizeStartEvent;
    realizeProgress: AutoBeRealizeProgressEvent;
    realizeValidate: AutoBeRealizeValidateEvent;
    realizeComplete: AutoBeRealizeCompleteEvent;
  }
}
