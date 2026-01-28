import OpenAI from "openai";

import { AutoBeEventSource } from "./AutoBeEventSource";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

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
export type AutoBeVendorResponseEvent =
  | AutoBeVendorResponseEvent.Streaming
  | AutoBeVendorResponseEvent.NonStreaming;
export namespace AutoBeVendorResponseEvent {
  export type Streaming = Base<
    true,
    OpenAI.ChatCompletionCreateParamsStreaming,
    AsyncGenerator<OpenAI.ChatCompletionChunk, undefined, undefined>
  >;

  export type NonStreaming = Base<
    false,
    OpenAI.ChatCompletionCreateParamsNonStreaming,
    OpenAI.ChatCompletion
  >;

  interface Base<
    Stream extends boolean,
    Body extends object,
    Completion extends object,
  > extends AutoBeEventBase<"vendorResponse"> {
    /**
     * The origin point that triggered this AI request.
     *
     * Identifies which specific agent operation initiated this AI request, such
     * as "analyzeWrite", "databaseSchema", or "testCorrect". This source
     * tracking enables precise attribution of AI usage to specific workflow
     * steps, facilitating cost allocation and performance analysis per
     * operation.
     */
    source: AutoBeEventSource;

    /**
     * Indicates whether the AI request is configured for streaming responses.
     *
     * When true, the AI's output will be delivered incrementally as it is
     * generated, allowing for real-time processing and display.
     *
     * When false, the full response will be returned in a single payload upon
     * completion.
     */
    stream: Stream;

    /**
     * The original OpenAI chat completion request parameters.
     *
     * Contains the complete request body that was sent to OpenAI's API,
     * providing context for the response. This allows correlation between
     * prompts and outputs, facilitating prompt engineering, debugging, and
     * quality analysis of AI interactions.
     */
    body: Body;

    /**
     * The complete chat completion response from OpenAI.
     *
     * Contains the full response object as returned by OpenAI's API, including
     * all generated content, usage statistics, and metadata.
     *
     * This comprehensive response is essential for evaluating the AI's output,
     * analyzing performance, and storing results for future reference.
     */
    completion: Completion;

    /**
     * The number of retry attempts made for this request.
     *
     * Indicates how many times the request was retried before receiving this
     * response. This information is useful for monitoring request reliability,
     * diagnosing issues, and optimizing retry strategies.
     */
    retry: number;

    /**
     * Optional request configuration used for the OpenAI API call.
     *
     * Includes the settings that were applied during the request execution,
     * such as timeout configurations and retry policies. This information helps
     * in debugging and understanding the conditions under which the response
     * was generated.
     */
    options?: OpenAI.RequestOptions | undefined;

    /**
     * Aggregates the streaming response into a complete chat completion.
     *
     * Utility method that consumes the entire stream and returns a unified
     * response object. This is useful when batch processing is preferred over
     * streaming, or when the complete response is needed for validation,
     * storage, or further processing.
     *
     * @returns Promise resolving to the complete chat completion response
     */
    join: () => Promise<OpenAI.ChatCompletion>;
  }
}
