import { AutoBeOpenApi } from "@autobe/interface";
import { LlmJson } from "@typia/utils";
import { IValidation } from "typia";

const obj: AutoBeOpenApi.IJsonSchema = {
  properties: {},
  additionalProperties: false,
  required: ["body"],
  type: "object",
};
const failure: IValidation.IFailure = {
  success: false,
  data: {
    request: {
      design: {
        schema: obj,
      },
    },
  },
  errors: [
    {
      path: "$input.request.design.schema.properties",
      expected: "At least 1 property in properties",
      value: obj.properties,
    },
  ],
};
const result = LlmJson.stringify(failure);
console.log(result);
