import { AutoBeProcessAggregate } from "../../histories/contents/AutoBeProcessAggregate";

/**
 * Base type for AutoBE events that track AI agent operation metrics.
 *
 * This type alias provides a semantic name for events that include process
 * aggregate metrics, combining both token usage statistics and function calling
 * execution outcomes. Events using this base type report comprehensive
 * operational data for individual AI agent tasks within the AutoBE pipeline.
 *
 * By aliasing `AutoBeProcessAggregate`, this type ensures consistent metric
 * tracking across all aggregate events (e.g., `AutoBeAnalyzeScenarioEvent`,
 * `AutoBeDatabaseSchemaEvent`, `AutoBeRealizeWriteEvent`) while maintaining a
 * clear semantic distinction between the general-purpose aggregate structure
 * and its specific usage as an event base type.
 *
 * Events using this base type enable real-time monitoring of:
 *
 * - Token consumption for cost analysis and optimization
 * - Function calling success rates for reliability assessment
 * - Validation failures and error patterns for prompt improvement
 *
 * @author Samchon
 */
export type AutoBeAggregateEventBase = AutoBeProcessAggregate;
