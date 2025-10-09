import { MicroAgentica } from "@agentica/core";
import { ILlmSchema } from "@samchon/openapi";
import OpenAI from "openai";

import { IAutoBeVendor } from "../structures/IAutoBeVendor";

export const supportMistral = <Model extends ILlmSchema.Model>(
  agent: MicroAgentica<Model>,
  vendor: IAutoBeVendor,
): void => {
  if (
    vendor.model.includes("mistral") ||
    vendor.model.includes("devstral") ||
    vendor.model.includes("codestral")
  ) {
    agent.on("request", async (e) => {
      const newMessages: OpenAI.ChatCompletionMessageParam[] = [];
      for (const m of e.body.messages) {
        newMessages.push(m);
        if (m.role === "tool") {
          m.tool_call_id = uuidToShortId(m.tool_call_id);
          newMessages.push({
            role: "assistant",
            content: "A tool has been called.",
          });
        } else if (m.role === "assistant") {
          for (const call of m.tool_calls ?? [])
            call.id = uuidToShortId(call.id);
        }
      }
      e.body.messages = newMessages;
    });

    // agent.on("request", (e) => {
    //   const toolCalls: OpenAI.ChatCompletionMessageFunctionToolCall[] =
    //     e.body.messages
    //       .filter((m) => m.role === "assistant")
    //       .filter((m) => !!m.tool_calls?.length)
    //       .map((m) => m.tool_calls ?? [])
    //       .flat()
    //       .filter((c) => c.type === "function");
    //   e.body.messages.forEach((m, i, array) => {
    //     if (m.role !== "tool") return;
    //     const call: OpenAI.ChatCompletionMessageFunctionToolCall | undefined =
    //       toolCalls.find((c) => c.id === m.tool_call_id);
    //     const content: string = getFunctionCallMessage(m, call);
    //     array[i] = {
    //       role: "assistant",
    //       content,
    //     };
    //   });
    //   e.body.messages = e.body.messages.filter(
    //     (m) => m.role !== "assistant" || !m.tool_calls?.length,
    //   );
    // });
  }
};

// const getFunctionCallMessage = (
//   param: OpenAI.ChatCompletionToolMessageParam,
//   call: OpenAI.ChatCompletionMessageFunctionToolCall | undefined,
// ): string => {
//   if (call === undefined) {
//     // unreachable
//     return StringUtil.trim`
//       ## Function Call

//       A function has been called, but could not find its arguments.

//       - id: ${param.tool_call_id}
//       - content: ${param.content}
//     `;
//   }
//   return StringUtil.trim`
//     ## Function Call

//     - id: ${call.id}
//     - function name: ${call.function.name}
//     - arguments: ${JSON.stringify(call.function.arguments)}
//     - content: ${param.content}
//   `;
// };

const BASE62_CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

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
  let n = num;

  while (n > 0 && result.length < length) {
    result = BASE62_CHARS[n % 62] + result;
    n = Math.floor(n / 62);
  }

  return result.padStart(length, "0");
}

function uuidToShortId(uuid: string): string {
  const hash = simpleHash(uuid);
  return toBase62(hash, 9);
}
