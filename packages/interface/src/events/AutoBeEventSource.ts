import { AutoBeAnalyzeReviewEvent } from "./AutoBeAnalyzeReviewEvent";
import { AutoBeAnalyzeScenarioEvent } from "./AutoBeAnalyzeScenarioEvent";
import { AutoBeAnalyzeWriteEvent } from "./AutoBeAnalyzeWriteEvent";
import { AutoBeInterfaceAuthorizationEvent } from "./AutoBeInterfaceAuthorizationEvent";
import { AutoBeInterfaceComplementEvent } from "./AutoBeInterfaceComplementEvent";
import { AutoBeInterfaceEndpointEvent } from "./AutoBeInterfaceEndpointEvent";
import { AutoBeInterfaceEndpointReviewEvent } from "./AutoBeInterfaceEndpointReviewEvent";
import { AutoBeInterfaceGroupEvent } from "./AutoBeInterfaceGroupEvent";
import { AutoBeInterfaceOperationEvent } from "./AutoBeInterfaceOperationEvent";
import { AutoBeInterfaceOperationReviewEvent } from "./AutoBeInterfaceOperationReviewEvent";
import { AutoBeInterfacePrerequisiteEvent } from "./AutoBeInterfacePrerequisiteEvent";
import { AutoBeInterfaceSchemaEvent } from "./AutoBeInterfaceSchemaEvent";
import { AutoBeInterfaceSchemaRenameEvent } from "./AutoBeInterfaceSchemaRenameEvent";
import { AutoBeInterfaceSchemaReviewEvent } from "./AutoBeInterfaceSchemaReviewEvent";
import { AutoBePreliminaryEvent } from "./AutoBePreliminaryEvent";
import { AutoBePrismaComponentEvent } from "./AutoBePrismaComponentEvent";
import { AutoBePrismaCorrectEvent } from "./AutoBePrismaCorrectEvent";
import { AutoBePrismaReviewEvent } from "./AutoBePrismaReviewEvent";
import { AutoBePrismaSchemaEvent } from "./AutoBePrismaSchemaEvent";
import { AutoBeRealizeAuthorizationCorrectEvent } from "./AutoBeRealizeAuthorizationCorrectEvent";
import { AutoBeRealizeAuthorizationWriteEvent } from "./AutoBeRealizeAuthorizationWriteEvent";
import { AutoBeRealizeCorrectEvent } from "./AutoBeRealizeCorrectEvent";
import { AutoBeRealizeWriteEvent } from "./AutoBeRealizeWriteEvent";
import { AutoBeTestCorrectEvent } from "./AutoBeTestCorrectEvent";
import { AutoBeTestScenarioEvent } from "./AutoBeTestScenarioEvent";
import { AutoBeTestScenarioReviewEvent } from "./AutoBeTestScenarioReviewEvent";
import { AutoBeTestWriteEvent } from "./AutoBeTestWriteEvent";

/**
 * Union type representing all event sources that trigger AI agent requests.
 *
 * This type enumerates the origin points where actual AI requests are initiated
 * throughout the AutoBE backend generation pipeline. Each event source
 * represents a specific operation that requires AI processing, such as writing
 * code, reviewing schemas, correcting errors, or generating specifications.
 *
 * The event sources are organized by agent and operation type:
 *
 * - **facade**: The initial orchestration layer that coordinates all agents
 * - **analyze**: Scenario planning, requirement writing, and review operations
 * - **prisma**: Database component design, schema generation, review, and
 *   correction
 * - **interface**: API authorization, grouping, endpoint design, operation
 *   definition, schema specification, reviews, and complementary generation
 * - **test**: Test scenario planning, test code writing, and error correction
 * - **realize**: Implementation code writing, corrections, and authorization
 *   logic
 *
 * These event sources are specifically used in {@link AutoBeVendorRequestEvent}
 * and {@link AutoBeVendorResponseEvent} to track which agent operation triggered
 * each AI interaction. This enables precise attribution of AI usage, token
 * consumption tracking, and performance monitoring for each distinct operation
 * in the backend generation workflow.
 *
 * @author Samchon
 * @see AutoBeVendorRequestEvent
 * @see AutoBeVendorResponseEvent
 */
export type AutoBeEventSource =
  | "facade"
  | AutoBePreliminaryEvent["type"]
  // analyze
  | AutoBeAnalyzeScenarioEvent["type"]
  | AutoBeAnalyzeWriteEvent["type"]
  | AutoBeAnalyzeReviewEvent["type"]
  // prisma
  | AutoBePrismaComponentEvent["type"]
  | AutoBePrismaSchemaEvent["type"]
  | AutoBePrismaReviewEvent["type"]
  | AutoBePrismaCorrectEvent["type"]
  // interface
  | AutoBeInterfaceAuthorizationEvent["type"]
  | AutoBeInterfaceGroupEvent["type"]
  | AutoBeInterfaceEndpointEvent["type"]
  | AutoBeInterfaceEndpointReviewEvent["type"]
  | AutoBeInterfaceOperationEvent["type"]
  | AutoBeInterfaceOperationReviewEvent["type"]
  | AutoBeInterfaceSchemaEvent["type"]
  | AutoBeInterfaceSchemaReviewEvent["type"]
  | AutoBeInterfaceSchemaRenameEvent["type"]
  | AutoBeInterfaceComplementEvent["type"]
  | AutoBeInterfacePrerequisiteEvent["type"]
  // test
  | AutoBeTestScenarioEvent["type"]
  | AutoBeTestScenarioReviewEvent["type"]
  | AutoBeTestWriteEvent["type"]
  | AutoBeTestCorrectEvent["type"]
  // realize
  | AutoBeRealizeWriteEvent["type"]
  | AutoBeRealizeCorrectEvent["type"]
  | AutoBeRealizeAuthorizationWriteEvent["type"]
  | AutoBeRealizeAuthorizationCorrectEvent["type"];
