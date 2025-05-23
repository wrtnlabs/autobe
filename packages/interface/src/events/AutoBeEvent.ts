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
import { AutoBeRealizeStartEvent } from "./AutoBeRealizeStartEvent";
import { AutoBeTestCompleteEvent } from "./AutoBeTestCompleteEvent";
import { AutoBeTestStartEvent } from "./AutoBeTestStartEvent";
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
  | AutoBeTestCompleteEvent
  | AutoBeRealizeStartEvent
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
    testComplete: AutoBeTestCompleteEvent;
    realizeStart: AutoBeRealizeStartEvent;
    realizeComplete: AutoBeRealizeCompleteEvent;
  }
}
