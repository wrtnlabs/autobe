import { MicroAgentica } from "@agentica/core";
import { v7 } from "uuid";

import { IAutoBeVendor } from "../structures/IAutoBeVendor";
import {
  IParsedFunctionCall,
  parseTextFunctionCall,
} from "../utils/parseTextFunctionCall";

/**
 * Applies function call fallback patches to MicroAgentica agent.
 *
 * Some models return function calls as plain text/JSON in `message.content`
 * instead of the proper `tool_calls` field. This function wraps
 * `vendor.api.chat.completions.create` to intercept non-streaming responses
 * and parse text-based function calls into proper `tool_calls`.
 *
 * Without this patch, text-based function calls are treated as assistant
 * messages, causing `enforceFunctionCall` checks to fail.
 *
 * The wrapping is idempotent — calling this multiple times with the same
 * vendor will only wrap once (guarded by a Symbol).
 *
 * @param agent MicroAgentica instance (unused, kept for signature consistency
 *   with supportMistral)
 * @param vendor Vendor configuration containing API instance
 */
export const supportFunctionCallFallback = (
  _agent: MicroAgentica,
  vendor: IAutoBeVendor,
): void => {
  const completions = vendor.api.chat.completions as unknown as ICompletions;
  if (completions[WRAPPED]) return;

  const originalCreate = completions.create.bind(completions);

  completions.create = async function wrappedCreate(
    body: ICreateBody,
    options?: Record<string, unknown>,
  ): Promise<unknown> {
    for (let attempt = 0; attempt < UPSTREAM_ERROR_RETRY; attempt++) {
      const result = await originalCreate(body, options);

      // OpenRouter returns upstream errors (502, etc.) as HTTP 200 with error body
      const maybeError = result as Record<string, unknown>;
      if (
        maybeError?.error &&
        typeof maybeError.error === "object" &&
        (maybeError.error as Record<string, unknown>)?.code
      ) {
        continue;
      }

      // Only patch non-streaming responses that had tools defined
      if (!body.stream && body.tools?.length) {
        patchCompletionIfNeeded(result as ICompletion, body.tools);
      }

      return result;
    }

    throw new Error(
      "OpenRouter upstream error: all retries exhausted",
    );
  };

  completions[WRAPPED] = true;
};

// ──────────────────────────────────────────────
// Internal types (local shapes, no openai import)
// ──────────────────────────────────────────────

const WRAPPED = Symbol.for("autobe:function-call-fallback-wrapped");

interface ICompletions {
  [WRAPPED]?: boolean;
  create: (
    body: ICreateBody,
    options?: Record<string, unknown>,
  ) => Promise<unknown>;
}

interface ICreateBody {
  stream?: boolean;
  tools?: ITool[];
  [key: string]: unknown;
}

interface ITool {
  type: string;
  function: { name: string };
}

const UPSTREAM_ERROR_RETRY = 15;

interface ICompletion {
  choices?: IChoice[];
}

interface IChoice {
  message: {
    content?: string | null;
    tool_calls?: IToolCall[];
  };
}

interface IToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

/**
 * Inspects each choice in the completion. If `tool_calls` is empty but
 * `content` contains text-based function calls, parse them and inject as
 * proper `tool_calls`.
 */
function patchCompletionIfNeeded(
  completion: ICompletion,
  tools: ITool[],
): void {
  const toolNames = tools
    .filter((t) => t.type === "function")
    .map((t) => t.function.name);

  for (const choice of completion.choices ?? []) {
    // Filter out malformed tool_calls (missing function field)
    if (choice.message.tool_calls?.length) {
      choice.message.tool_calls = choice.message.tool_calls.filter(
        (tc) => tc.function?.name,
      );
      if (choice.message.tool_calls.length) continue;
    }

    const content = choice.message.content?.trim();
    if (!content) continue;

    const parsed: IParsedFunctionCall[] = parseTextFunctionCall(
      content,
      toolNames,
    );
    if (parsed.length === 0) continue;

    // Convert parsed calls to proper tool_calls structure
    choice.message.tool_calls = parsed.map((call) => ({
      id: `call_${v7()}`,
      type: "function" as const,
      function: {
        name: call.name,
        arguments: call.arguments,
      },
    }));

    // Clear content since it was actually a function call, not a message
    choice.message.content = null;
  }
}
