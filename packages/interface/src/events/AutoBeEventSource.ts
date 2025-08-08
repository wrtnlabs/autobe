import { AutoBeAnalyzeReviewEvent } from "./AutoBeAnalyzeReviewEvent";
import { AutoBeAnalyzeWriteEvent } from "./AutoBeAnalyzeWriteEvent";
import { AutoBeInterfaceAuthorizationEvent } from "./AutoBeInterfaceAuthorizationEvent";
import { AutoBeInterfaceComplementEvent } from "./AutoBeInterfaceComplementEvent";
import { AutoBeInterfaceEndpointsEvent } from "./AutoBeInterfaceEndpointsEvent";
import { AutoBeInterfaceGroupsEvent } from "./AutoBeInterfaceGroupsEvent";
import { AutoBeInterfaceOperationsEvent } from "./AutoBeInterfaceOperationsEvent";
import { AutoBeInterfaceSchemasEvent } from "./AutoBeInterfaceSchemasEvent";
import { AutoBePrismaComponentsEvent } from "./AutoBePrismaComponentsEvent";
import { AutoBePrismaCorrectEvent } from "./AutoBePrismaCorrectEvent";
import { AutoBePrismaReviewEvent } from "./AutoBePrismaReviewEvent";
import { AutoBePrismaSchemasEvent } from "./AutoBePrismaSchemasEvent";
import { AutoBeRealizeAuthorizationCorrectEvent } from "./AutoBeRealizeAuthorizationCorrectEvent";
import { AutoBeRealizeAuthorizationWriteEvent } from "./AutoBeRealizeAuthorizationWriteEvent";
import { AutoBeRealizeCorrectEvent } from "./AutoBeRealizeCorrectEvent";
import { AutoBeRealizeWriteEvent } from "./AutoBeRealizeWriteEvent";
import { AutoBeTestCorrectEvent } from "./AutoBeTestCorrectEvent";
import { AutoBeTestScenarioEvent } from "./AutoBeTestScenarioEvent";
import { AutoBeTestWriteEvent } from "./AutoBeTestWriteEvent";

export type AutoBeEventSource =
  | "facade"
  // analyze
  | AutoBeAnalyzeWriteEvent["type"]
  | AutoBeAnalyzeReviewEvent["type"]
  // prisma
  | AutoBePrismaComponentsEvent["type"]
  | AutoBePrismaSchemasEvent["type"]
  | AutoBePrismaReviewEvent["type"]
  | AutoBePrismaCorrectEvent["type"]
  // interface
  | AutoBeInterfaceAuthorizationEvent["type"]
  | AutoBeInterfaceGroupsEvent["type"]
  | AutoBeInterfaceEndpointsEvent["type"]
  | AutoBeInterfaceOperationsEvent["type"]
  | AutoBeInterfaceSchemasEvent["type"]
  | AutoBeInterfaceComplementEvent["type"]
  // test
  | AutoBeTestScenarioEvent["type"]
  | AutoBeTestWriteEvent["type"]
  | AutoBeTestCorrectEvent["type"]
  // realize
  | AutoBeRealizeWriteEvent["type"]
  | AutoBeRealizeCorrectEvent["type"]
  | AutoBeRealizeAuthorizationWriteEvent["type"]
  | AutoBeRealizeAuthorizationCorrectEvent["type"];
