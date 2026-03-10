import { MicroAgentica } from "@agentica/core";
import OpenAI from "openai";

import { IAutoBeVendor } from "../structures/IAutoBeVendor";

/**
 * Applies Qwen-specific API compatibility patches to MicroAgentica agent.
 *
 * Qwen models served through OpenRouter (often via Google infrastructure) do
 * not support streaming with function calling consistently across providers.
 * Some hosted variants also reject stricter OpenAI-style tool message shapes
 * during validation-retry turns.
 *
 * This function intercepts API requests and disables streaming entirely for
 * Qwen models, removes the OpenAI-proprietary `stream_options` parameter, and
 * normalizes tool-call message shapes to a more conservative format.
 *
 * @param agent MicroAgentica instance to patch
 * @param vendor Vendor configuration containing model name
 */
export const supportQwen = (
  agent: MicroAgentica,
  vendor: IAutoBeVendor,
): void => {
  if (vendor.model.includes("qwen")) {
    agent.on("request", async (e) => {
      const body = e.body as unknown as Record<string, unknown>;
      body.stream = false;
      delete body.stream_options;

      const originalMessages = (body.messages ??
        []) as OpenAI.ChatCompletionMessageParam[];
      const messages = reorderSystemMessages(originalMessages);
      for (const message of messages) {
        if (message.role === "assistant") {
          if ("content" in message === false || message.content == null) {
            (message as OpenAI.ChatCompletionAssistantMessageParam).content =
              "";
          }
        }
      }
      body.messages = messages;
    });
  }
};

function reorderSystemMessages(
  messages: OpenAI.ChatCompletionMessageParam[],
): OpenAI.ChatCompletionMessageParam[] {
  const systems: OpenAI.ChatCompletionSystemMessageParam[] = [];
  const others: OpenAI.ChatCompletionMessageParam[] = [];
  for (const message of messages) {
    if (message.role === "system") systems.push(message);
    else others.push(message);
  }
  if (systems.length <= 1) return [...systems, ...others];
  return [
    {
      role: "system",
      content: systems
        .map((msg) => flattenSystemContent(msg.content))
        .filter((str) => str.length !== 0)
        .join("\n\n"),
    },
    ...others,
  ];
}

function flattenSystemContent(
  content: OpenAI.ChatCompletionSystemMessageParam["content"],
): string {
  if (typeof content === "string") return content;
  return content
    .map((part) => ("text" in part ? part.text : ""))
    .filter((str) => str.length !== 0)
    .join("\n");
}
