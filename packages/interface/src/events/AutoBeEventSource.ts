import { AutoBeAnalyzeScenarioEvent } from "./AutoBeAnalyzeScenarioEvent";
import { AutoBeAnalyzeSectionReviewEvent } from "./AutoBeAnalyzeSectionReviewEvent";
import { AutoBeAnalyzeWriteModuleEvent } from "./AutoBeAnalyzeWriteModuleEvent";
import { AutoBeAnalyzeWriteSectionEvent } from "./AutoBeAnalyzeWriteSectionEvent";
import { AutoBeAnalyzeWriteUnitEvent } from "./AutoBeAnalyzeWriteUnitEvent";
import { AutoBeDatabaseAuthorizationEvent } from "./AutoBeDatabaseAuthorizationEvent";
import { AutoBeDatabaseComponentEvent } from "./AutoBeDatabaseComponentEvent";
import { AutoBeDatabaseCorrectEvent } from "./AutoBeDatabaseCorrectEvent";
import { AutoBeDatabaseGroupEvent } from "./AutoBeDatabaseGroupEvent";
import { AutoBeDatabaseSchemaEvent } from "./AutoBeDatabaseSchemaEvent";
import { AutoBeImageDescribeCompleteEvent } from "./AutoBeImageDescribeCompleteEvent";
import { AutoBeImageDescribeDraftEvent } from "./AutoBeImageDescribeDraftEvent";
import { AutoBeInterfaceAuthorizationEvent } from "./AutoBeInterfaceAuthorizationEvent";
import { AutoBeInterfaceEndpointEvent } from "./AutoBeInterfaceEndpointEvent";
import { AutoBeInterfaceGroupEvent } from "./AutoBeInterfaceGroupEvent";
import { AutoBeInterfaceOperationEvent } from "./AutoBeInterfaceOperationEvent";
import { AutoBeInterfacePrerequisiteEvent } from "./AutoBeInterfacePrerequisiteEvent";
import { AutoBeInterfaceSchemaCastingEvent } from "./AutoBeInterfaceSchemaCastingEvent";
import { AutoBeInterfaceSchemaComplementEvent } from "./AutoBeInterfaceSchemaComplementEvent";
import { AutoBeInterfaceSchemaDecoupleEvent } from "./AutoBeInterfaceSchemaDecoupleEvent";
import { AutoBeInterfaceSchemaEvent } from "./AutoBeInterfaceSchemaEvent";
import { AutoBeInterfaceSchemaRefineEvent } from "./AutoBeInterfaceSchemaRefineEvent";
import { AutoBeInterfaceSchemaRenameEvent } from "./AutoBeInterfaceSchemaRenameEvent";
import { AutoBeInterfaceSchemaReviewEvent } from "./AutoBeInterfaceSchemaReviewEvent";
import { AutoBePreliminaryAcquireEvent } from "./AutoBePreliminaryAcquireEvent";
import { AutoBeRealizeAuthorizationCorrectEvent } from "./AutoBeRealizeAuthorizationCorrectEvent";
import { AutoBeRealizeAuthorizationWriteEvent } from "./AutoBeRealizeAuthorizationWriteEvent";
import { AutoBeRealizeCorrectEvent } from "./AutoBeRealizeCorrectEvent";
import { AutoBeRealizePlanEvent } from "./AutoBeRealizePlanEvent";
import { AutoBeRealizeWriteEvent } from "./AutoBeRealizeWriteEvent";
import { AutoBeTestCorrectEvent } from "./AutoBeTestCorrectEvent";
import { AutoBeTestScenarioEvent } from "./AutoBeTestScenarioEvent";
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
 * - **prisma**: Database component design, schema generation, and correction
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
  | AutoBePreliminaryAcquireEvent["type"]
  // describe
  | AutoBeImageDescribeDraftEvent["type"]
  | AutoBeImageDescribeCompleteEvent["type"]
  // analyze
  | AutoBeAnalyzeScenarioEvent["type"]
  // analyze (hierarchical write V2 - Module/Unit/Section)
  | AutoBeAnalyzeWriteModuleEvent["type"]
  | AutoBeAnalyzeWriteUnitEvent["type"]
  | AutoBeAnalyzeWriteSectionEvent["type"]
  // analyze (cross-file review)
  | AutoBeAnalyzeSectionReviewEvent["type"]
  // database
  | AutoBeDatabaseGroupEvent["type"]
  | AutoBeDatabaseAuthorizationEvent["type"]
  | AutoBeDatabaseComponentEvent["type"]
  | AutoBeDatabaseSchemaEvent["type"]
  | AutoBeDatabaseCorrectEvent["type"]
  // interface
  | AutoBeInterfaceAuthorizationEvent["type"]
  | AutoBeInterfaceGroupEvent["type"]
  | AutoBeInterfaceEndpointEvent["type"]
  | AutoBeInterfaceOperationEvent["type"]
  | AutoBeInterfaceSchemaEvent["type"]
  | AutoBeInterfaceSchemaCastingEvent["type"]
  | AutoBeInterfaceSchemaRefineEvent["type"]
  | AutoBeInterfaceSchemaReviewEvent["type"]
  | AutoBeInterfaceSchemaRenameEvent["type"]
  | AutoBeInterfaceSchemaComplementEvent["type"]
  | AutoBeInterfaceSchemaDecoupleEvent["type"]
  | AutoBeInterfacePrerequisiteEvent["type"]
  // test
  | AutoBeTestScenarioEvent["type"]
  | AutoBeTestWriteEvent["type"]
  | AutoBeTestCorrectEvent["type"]
  // realize
  | AutoBeRealizePlanEvent["type"]
  | AutoBeRealizeWriteEvent["type"]
  | AutoBeRealizeCorrectEvent["type"]
  | AutoBeRealizeAuthorizationWriteEvent["type"]
  | AutoBeRealizeAuthorizationCorrectEvent["type"];
