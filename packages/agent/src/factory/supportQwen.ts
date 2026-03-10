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
      const idMap = new Map<string, string>();
      for (const message of messages) {
        if (message.role === "assistant") {
          if ("content" in message === false || message.content == null) {
            (message as OpenAI.ChatCompletionAssistantMessageParam).content =
              "";
          }
          for (const toolCall of message.tool_calls ?? []) {
            if (toolCall.type !== "function") continue;
            const shortId = shortenToolCallId(toolCall.id);
            idMap.set(toolCall.id, shortId);
            toolCall.id = shortId;
          }
        } else if (message.role === "tool") {
          message.tool_call_id =
            idMap.get(message.tool_call_id) ??
            shortenToolCallId(message.tool_call_id);
        }
      }
      body.messages = messages;
    });
  }
};

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function shortenToolCallId(id: string): string {
  if (id.length <= 40) return id;
  return `call_${toBase62(simpleHash(id), 12)}`;
}

function simpleHash(str: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function toBase62(num: number, length: number): string {
  let result = "";
  let value = num;
  while (value > 0 && result.length < length) {
    result = BASE62[value % 62] + result;
    value = Math.floor(value / 62);
  }
  return result.padStart(length, "0");
}

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
