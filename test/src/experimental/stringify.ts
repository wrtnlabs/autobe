import { stringifyValidationFailure } from "@autobe/agent/src/utils/stringifyValidationFailure";
import { IValidation } from "typia";

const failure: IValidation.IFailure = {
  success: false,
  data: {
    x: {
      y: [{}, {}],
    },
    value: [1, 2, 3, 4],
  },
  errors: [
    {
      path: "$input.value[]",
      expected: "number",
      value: undefined,
    },
    {
      path: "$input.value[]",
      expected: "number",
      value: undefined,
    },
    {
      path: "$input.value[1]",
      expected: "string",
      value: 2,
    },
    {
      path: "$input.something",
      expected: "string",
      value: undefined,
    },
    {
      path: "$input.value",
      expected: "Array<number> & tags.MinItems<10>",
      value: undefined,
    },
    {
      path: "$input.x.y[1].z",
      expected: "string",
      value: undefined,
    },
  ],
};
console.log(stringifyValidationFailure(failure));
