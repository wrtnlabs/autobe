import OpenAI from "openai";

export interface AutoBeRequestEvent {
  body: OpenAI.ChatCompletionCreateParamsStreaming;
  options?: OpenAI.RequestOptions | undefined;
}
