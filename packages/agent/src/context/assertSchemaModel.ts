import { ILlmSchema } from "@samchon/openapi";

export function assertSchemaModel<Model extends ILlmSchema.Model>(
  model: Model,
): asserts model is Exclude<Model, "3.0"> {
  if (model === "3.0")
    throw new Error(
      [
        "Error on AutoBeAgent.constructor(): schema version 3.0 is not supported",
        "due to limitations in the JSON schema specification for function calling.",
        "Please use a different model that supports modern JSON schema features.",
      ].join(" "),
    );
}
