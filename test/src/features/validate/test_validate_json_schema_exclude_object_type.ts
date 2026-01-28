import { fulfillJsonSchemaErrorMessages } from "@autobe/agent/src/orchestrate/interface/utils/fulfillJsonSchemaErrorMessages";
import { TestValidator } from "@nestia/e2e";
import { IValidation } from "typia";

export const test_validate_json_schema_exclude_object_type = (): void => {
  const error: IValidation.IError = {
    path: "$input.request.schema.properties.metadata",
    expected:
      "(AutoBeOpenApi.IJsonSchemaProperty.IConstant | AutoBeOpenApi.IJsonSchemaProperty.IBoolean | AutoBeOpenApi.IJsonSchemaProperty.INumber | AutoBeOpenApi.IJsonSchemaProperty.IInteger | AutoBeOpenApi.IJsonSchemaProperty.IString | AutoBeOpenApi.IJsonSchemaProperty.IArray | AutoBeOpenApi.IJsonSchemaProperty.IReference | AutoBeOpenApi.IJsonSchemaProperty.IOneOf | AutoBeOpenApi.IJsonSchemaProperty.INull)",
    value: {
      "x-autobe-specification":
        "Direct mapping from economy_board_moderation_actions.metadata column. JSON object storing additional context, action details, system flags, or extended information related to the moderation event.",
      description:
        "Extended metadata object containing additional context or system-provided details about the moderation event. This may include confidence scores from automated systems, suppression reason codes, action duration, related report IDs, or multiple flags associated with the event. Stored as a JSON object with dynamic key-value pairs.",
      type: "object",
      properties: {},
      required: [],
      additionalProperties: { type: "string" },
    },
  };
  fulfillJsonSchemaErrorMessages([error]);
  TestValidator.equals("description", !!error.description, true);
};
