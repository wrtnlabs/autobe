import { ILlmSchema } from "@samchon/openapi";

export function assertSchemaModel<Model extends ILlmSchema.Model>(
  model: Model,
): asserts model is Exclude<Model, "gemini" | "3.0"> {
  if (model === "gemini")
    throw new Error(
      [
        "Error on AutoBeAgent.constructor(): gemini is not supported",
        "because it does not follow standard JSON schema specification.",
        "@autobe requires union type (`oneOf` or `anyOf`) for backend code generation,",
        "but gemini has banned them. Please wait until when `@agentica`",
        "supports prompt based function calling which can detour gemini's",
        "restriction of JSON schema specification.",
      ].join(" "),
    );
}
