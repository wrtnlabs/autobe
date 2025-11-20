import { IAutoBeTokenUsageJson } from "../json";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired when the Describe agent integrates multiple drafts from a group.
 *
 * This event occurs when the system processes each group of related image
 * drafts to create a consolidated section document. Each integration represents
 * a complete specification for one functional area of the system, combining all
 * relevant requirements from multiple image analysis drafts.
 *
 * The integration process removes duplicates, resolves conflicts, and produces
 * a coherent section following the B2B SaaS requirements document format.
 */
export interface AutoBeDescribeImageDraftIntegrationEvent
  extends AutoBeEventBase<"describeImageDraftIntegration">,
    AutoBeProgressEventBase {
  /**
   * The cluster key that identifies this integrated section.
   *
   * Inherited from the group that was integrated.
   */
  clusterKey: string;

  /**
   * A comprehensive section document that integrates all drafts from a single
   * group.
   *
   * This document consolidates and synthesizes all the requirements, entities,
   * API endpoints, and business logic from multiple related drafts into a
   * coherent specification section for a specific functional area.
   *
   * Written in English following the B2B SaaS requirements document format.
   */
  integration: string;

  /**
   * Detailed token usage metrics for the operation.
   *
   * Contains comprehensive token consumption data including total usage, input
   * token breakdown with cache hit rates, and output token categorization by
   * generation type (reasoning, predictions). This component-level tracking
   * enables precise cost analysis and identification of operations that benefit
   * most from prompt caching or require optimization.
   *
   * Token usage directly translates to operational costs, making this metric
   * essential for understanding the financial implications of different
   * operation types and guiding resource allocation decisions.
   */
  tokenUsage: IAutoBeTokenUsageJson.IComponent;
}
