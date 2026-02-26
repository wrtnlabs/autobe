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
 * `vendor.api.chat.completions.create` to intercept non-streaming responses and
 * parse text-based function calls into proper `tool_calls`.
 *
 * Without this patch, text-based function calls are treated as assistant
 * messages, causing `enforceFunctionCall` checks to fail.
 *
 * The wrapping is idempotent — calling this multiple times with the same vendor
 * will only wrap once (guarded by a Symbol).
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
    const retryState = { upstream: 0, empty: 0, total: 0 };

    while (retryState.total < TOTAL_RETRY_CAP) {
      const result = await originalCreate(body, options);

      // OpenRouter returns upstream errors (502, etc.) as HTTP 200 with error body
      const maybeError = result as Record<string, unknown>;
      if (
        maybeError?.error &&
        typeof maybeError.error === "object" &&
        (maybeError.error as Record<string, unknown>)?.code
      ) {
        const err = maybeError.error as Record<string, unknown>;
        retryState.upstream++;
        retryState.total++;
        console.warn(
          `[FunctionCallFallback] OpenRouter upstream error (${err.code}): ${err.message ?? "unknown"} — retry ${retryState.upstream}/${UPSTREAM_502_RETRY}`,
        );
        if (retryState.upstream >= UPSTREAM_502_RETRY) break;
        await upstreamBackoffDelay(retryState.upstream - 1);
        continue;
      }

      // Empty response: model returned nothing (no content, no tool_calls)
      if (!body.stream && body.tools?.length) {
        const comp = result as ICompletion;
        if (isEmptyCompletion(comp)) {
          retryState.empty++;
          retryState.total++;
          console.warn(
            `[FunctionCallFallback] Empty response from model — retry ${retryState.empty}/${EMPTY_RESPONSE_RETRY}`,
          );
          if (retryState.empty >= EMPTY_RESPONSE_RETRY) break;
          await upstreamBackoffDelay(retryState.empty - 1);
          continue;
        }
        patchCompletionIfNeeded(comp, body.tools);
        // Re-check after patching: malformed tool_calls may have been
        // filtered out, leaving choices with no content and no valid
        // tool_calls.
        if (isEmptyCompletion(comp)) {
          retryState.empty++;
          retryState.total++;
          console.warn(
            `[FunctionCallFallback] Completion became empty after filtering malformed tool_calls — retry ${retryState.empty}/${EMPTY_RESPONSE_RETRY}`,
          );
          if (retryState.empty >= EMPTY_RESPONSE_RETRY) break;
          await upstreamBackoffDelay(retryState.empty - 1);
          continue;
        }
      }

      return result;
    }

    throw new Error(
      `OpenRouter upstream error: retries exhausted (upstream=${retryState.upstream}/${UPSTREAM_502_RETRY}, empty=${retryState.empty}/${EMPTY_RESPONSE_RETRY}, total=${retryState.total}/${TOTAL_RETRY_CAP})`,
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

const UPSTREAM_502_RETRY = 15;
const EMPTY_RESPONSE_RETRY = 5;
const TOTAL_RETRY_CAP = 17;

const UPSTREAM_BASE_DELAY = 1_000;
const UPSTREAM_MAX_DELAY = 15_000;

function upstreamBackoffDelay(attempt: number): Promise<void> {
  const delay = Math.min(
    UPSTREAM_BASE_DELAY * 2 ** attempt,
    UPSTREAM_MAX_DELAY,
  );
  const jittered = delay * (0.5 + Math.random() * 0.5);
  return new Promise((resolve) => setTimeout(resolve, jittered));
}

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

function isEmptyCompletion(completion: ICompletion): boolean {
  const choices = completion.choices ?? [];
  if (choices.length === 0) return true;
  return choices.every(
    (c) => !c.message.content?.trim() && !c.message.tool_calls?.length,
  );
}

/**
 * Inspects each choice in the completion. If `tool_calls` is empty but
 * `content` contains text-based function calls, parse them and inject as proper
 * `tool_calls`.
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
