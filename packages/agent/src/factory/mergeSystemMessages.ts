import { MicroAgentica } from "@agentica/core";
import OpenAI from "openai";

import { IAutoBeVendor } from "../structures/IAutoBeVendor";

/**
 * Merges multiple system messages into a single one.
 *
 * Some models (e.g. Qwen) require exactly one system message at the beginning
 * of the conversation. This function intercepts API requests and consolidates
 * all system messages into one.
 *
 * @param agent MicroAgentica instance to patch
 * @param vendor Vendor configuration containing model name
 */
export const mergeSystemMessages = (
  agent: MicroAgentica,
  vendor: IAutoBeVendor,
): void => {
  if (vendor.model.includes("qwen")) {
    agent.on("request", async (e) => {
      const body = e.body as unknown as Record<string, unknown>;
      const originalMessages = (body.messages ??
        []) as OpenAI.ChatCompletionMessageParam[];
      body.messages = consolidateSystemMessages(originalMessages);
    });
  }
};

function consolidateSystemMessages(
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
