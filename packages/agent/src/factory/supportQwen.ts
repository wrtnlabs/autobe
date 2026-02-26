import { MicroAgentica } from "@agentica/core";

import { IAutoBeVendor } from "../structures/IAutoBeVendor";

/**
 * Applies Qwen-specific API compatibility patches to MicroAgentica agent.
 *
 * Qwen models served through OpenRouter (often via Google infrastructure) do
 * not support streaming with function calling. Sending streaming requests
 * causes upstream 502 errors ("Upstream error from Google: undefined").
 *
 * This function intercepts API requests and disables streaming entirely for
 * Qwen models, also removing the OpenAI-proprietary `stream_options`
 * parameter.
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
    });
  }
};
