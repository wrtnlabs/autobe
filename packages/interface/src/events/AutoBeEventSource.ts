import { AutoBeAnalyzeReviewEvent } from "./AutoBeAnalyzeReviewEvent";
import { AutoBeAnalyzeScenarioEvent } from "./AutoBeAnalyzeScenarioEvent";
import { AutoBeAnalyzeWriteEvent } from "./AutoBeAnalyzeWriteEvent";
import { AutoBeInterfaceAuthorizationsEvent } from "./AutoBeInterfaceAuthorizationsEvent";
import { AutoBeInterfaceComplementEvent } from "./AutoBeInterfaceComplementEvent";
import { AutoBeInterfaceEndpointsEvent } from "./AutoBeInterfaceEndpointsEvent";
import { AutoBeInterfaceGroupsEvent } from "./AutoBeInterfaceGroupsEvent";
import { AutoBeInterfaceOperationsEvent } from "./AutoBeInterfaceOperationsEvent";
import { AutoBeInterfaceOperationsReviewEvent } from "./AutoBeInterfaceOperationsReviewEvent";
import { AutoBeInterfaceSchemasEvent } from "./AutoBeInterfaceSchemasEvent";
import { AutoBeInterfaceSchemasReviewEvent } from "./AutoBeInterfaceSchemasReviewEvent";
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
  | AutoBeAnalyzeScenarioEvent["type"]
  | AutoBeAnalyzeWriteEvent["type"]
  | AutoBeAnalyzeReviewEvent["type"]
  // prisma
  | AutoBePrismaComponentsEvent["type"]
  | AutoBePrismaSchemasEvent["type"]
  | AutoBePrismaReviewEvent["type"]
  | AutoBePrismaCorrectEvent["type"]
  // interface
  | AutoBeInterfaceAuthorizationsEvent["type"]
  | AutoBeInterfaceGroupsEvent["type"]
  | AutoBeInterfaceEndpointsEvent["type"]
  | AutoBeInterfaceOperationsEvent["type"]
  | AutoBeInterfaceOperationsReviewEvent["type"]
  | AutoBeInterfaceSchemasEvent["type"]
  | AutoBeInterfaceSchemasReviewEvent["type"]
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
