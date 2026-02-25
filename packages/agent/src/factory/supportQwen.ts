import { MicroAgentica } from "@agentica/core";

import { IAutoBeVendor } from "../structures/IAutoBeVendor";

/**
 * Applies Qwen-specific API compatibility patches to MicroAgentica agent.
 *
 * Qwen models served through OpenRouter (often via Google infrastructure)
 * do not support the OpenAI-proprietary `stream_options` parameter.
 * Sending `stream_options: { include_usage: true }` causes upstream 502
 * errors ("Upstream error from Google: undefined").
 *
 * This function intercepts API requests and removes `stream_options`
 * to prevent these failures while preserving streaming functionality.
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
      if ("stream_options" in e.body) {
        delete (e.body as Record<string, unknown>).stream_options;
      }
    });
  }
};
