import { MicroAgentica } from "@agentica/core";
import { ILlmSchema } from "@samchon/openapi";

export function enforceToolCall<Model extends ILlmSchema.Model>(
  agent: MicroAgentica<Model>,
): MicroAgentica<Model> {
  agent.on("request", (event) => {
    if (event.body.tools) event.body.tool_choice = "required";
    if (event.body.parallel_tool_calls !== undefined)
      delete event.body.parallel_tool_calls;
  });
  return agent;
}
