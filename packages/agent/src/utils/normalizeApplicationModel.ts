import { ILlmSchema } from "@samchon/openapi";

export const normalizeApplicationModel = (
  model: Exclude<ILlmSchema.Model, "3.0">,
): "chatgpt" | "gemini" | "claude" => {
  switch (model) {
    case "chatgpt":
    case "gemini":
      return model;
    default:
      return "claude";
  }
};
