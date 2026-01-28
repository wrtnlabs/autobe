import OpenAI from "openai";

import { AutoBeEventSource } from "./AutoBeEventSource";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

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
export type AutoBeVendorRequestEvent =
  | AutoBeVendorRequestEvent.Streaming
  | AutoBeVendorRequestEvent.NonStreaming;
export namespace AutoBeVendorRequestEvent {
  /** Streaming request event type. */
  export type Streaming = Base<
    true,
    OpenAI.ChatCompletionCreateParamsStreaming
  >;

  /** Non-streaming request event type. */
  export type NonStreaming = Base<
    false,
    OpenAI.ChatCompletionCreateParamsNonStreaming
  >;

  interface Base<
    Stream extends boolean,
    Body extends object,
  > extends AutoBeEventBase<"vendorRequest"> {
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
     * The complete OpenAI chat completion request parameters.
     *
     * Contains the full request body including messages, model selection,
     * temperature settings, and streaming configuration that will be sent to
     * OpenAI's API. This streaming-enabled request allows real-time processing
     * of AI responses for improved user experience and progressive output
     * generation.
     */
    body: Body;

    /**
     * The number of retry attempts made for this request.
     *
     * Indicates how many times the request was retried before receiving this
     * response. This information is useful for monitoring request reliability,
     * diagnosing issues, and optimizing retry strategies.
     */
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
}
