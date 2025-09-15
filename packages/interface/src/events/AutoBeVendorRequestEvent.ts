import OpenAI from "openai";

import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeEventSource } from "./AutoBeEventSource";

/**
 * Event emitted when sending a request to the AI vendor (OpenAI).
 *
 * This event represents the initiation of an AI processing request from any
 * agent in the AutoBE system. It captures the exact moment when a specific
 * operation (identified by the source) requires AI assistance, such as
 * generating code, reviewing schemas, or creating specifications.
 *
 * The event includes the complete request payload that will be sent to OpenAI's
 * API, enabling comprehensive tracking of AI interactions. This allows for
 * monitoring which agent operations are actively consuming AI resources,
 * debugging prompt effectiveness, and analyzing the flow of AI requests
 * throughout the backend generation pipeline.
 *
 * @author Samchon
 */
export interface AutoBeVendorRequestEvent
  extends AutoBeEventBase<"vendorRequest"> {
  /**
   * The origin point that triggered this AI request.
   *
   * Identifies which specific agent operation initiated this AI request, such
   * as "analyzeWrite", "prismaSchemas", or "testCorrect". This source tracking
   * enables precise attribution of AI usage to specific workflow steps,
   * facilitating cost allocation and performance analysis per operation.
   */
  source: AutoBeEventSource;

  /**
   * The complete OpenAI chat completion request parameters.
   *
   * Contains the full request body including messages, model selection,
   * temperature settings, and streaming configuration that will be sent to
   * OpenAI's API. This streaming-enabled request allows real-time processing of
   * AI responses for improved user experience and progressive output
   * generation.
   */
  body: OpenAI.ChatCompletionCreateParamsStreaming;

  retry: number;

  /**
   * Optional request configuration for the OpenAI API call.
   *
   * Includes additional settings such as timeout configurations, retry
   * policies, and custom headers that control how the request is executed.
   * These options ensure reliable AI interactions even under varying network
   * conditions or API availability scenarios.
   */
  options?: OpenAI.RequestOptions | undefined;
}
