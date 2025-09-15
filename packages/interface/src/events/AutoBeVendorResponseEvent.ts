import OpenAI from "openai";

import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeEventSource } from "./AutoBeEventSource";

/**
 * Event emitted when receiving a response from the AI vendor (OpenAI).
 *
 * This event represents the AI vendor's response to a processing request from
 * any agent in the AutoBE system. It captures both the original request context
 * and the streaming response, enabling real-time processing and monitoring of
 * AI-generated content as it's being produced.
 *
 * The event provides access to the streaming response chunks, allowing
 * consumers to process AI output progressively for better user experience. It
 * also includes a utility method to aggregate the complete response when
 * streaming is complete, supporting both real-time and batch processing
 * scenarios.
 *
 * This event is crucial for tracking AI response generation, monitoring
 * completion rates, and analyzing the quality and characteristics of
 * AI-generated content across different agent operations.
 *
 * @author Samchon
 */
export interface AutoBeVendorResponseEvent
  extends AutoBeEventBase<"vendorResponse"> {
  /**
   * The origin point that triggered this AI response.
   *
   * Identifies which specific agent operation initiated the AI request that
   * resulted in this response. This source tracking maintains the connection
   * between requests and responses, enabling end-to-end monitoring of AI
   * interactions and performance analysis per operation type.
   */
  source: AutoBeEventSource;

  /**
   * The original OpenAI chat completion request parameters.
   *
   * Contains the complete request body that was sent to OpenAI's API, providing
   * context for the response. This allows correlation between prompts and
   * outputs, facilitating prompt engineering, debugging, and quality analysis
   * of AI interactions.
   */
  body: OpenAI.ChatCompletionCreateParamsStreaming;

  /**
   * Async generator providing streaming response chunks from OpenAI.
   *
   * Yields chat completion chunks as they are received from the AI vendor,
   * enabling real-time processing of AI-generated content. Each chunk contains
   * partial response data that can be immediately displayed or processed,
   * improving perceived performance and user experience.
   */
  stream: AsyncGenerator<OpenAI.ChatCompletionChunk, undefined, undefined>;

  retry: number;

  /**
   * Optional request configuration used for the OpenAI API call.
   *
   * Includes the settings that were applied during the request execution, such
   * as timeout configurations and retry policies. This information helps in
   * debugging and understanding the conditions under which the response was
   * generated.
   */
  options?: OpenAI.RequestOptions | undefined;

  /**
   * Aggregates the streaming response into a complete chat completion.
   *
   * Utility method that consumes the entire stream and returns a unified
   * response object. This is useful when batch processing is preferred over
   * streaming, or when the complete response is needed for validation, storage,
   * or further processing.
   *
   * @returns Promise resolving to the complete chat completion response
   */
  join: () => Promise<OpenAI.ChatCompletion>;
}
