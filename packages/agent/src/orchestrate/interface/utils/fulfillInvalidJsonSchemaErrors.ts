import { StringUtil } from "@autobe/utils";
import { IValidation } from "typia";

export const fulfillInvalidJsonSchemaErrors = (
  errors: IValidation.IError[],
): void => {
  for (const e of errors)
    if (
      e.expected.startsWith("(") &&
      e.expected.endsWith(")") &&
      e.expected.includes("|") &&
      e.expected
        .split("|")
        .map((s) => s.trim())
        .every(
          (s) =>
            s.startsWith("AutoBeOpenApi.IJsonSchema.") ||
            s.startsWith("AutoBeOpenApi.IJsonSchemaDescriptive."),
        ) &&
      typeof e.value === "object" &&
      e.value !== null &&
      "type" in e.value &&
      Array.isArray(e.value.type)
    ) {
      e.description = StringUtil.trim`
        You have defined the JSON schema's type property value as an 
        array type listing up the every types what you want, but it is not 
        allowed in the JSON schema.
        
        The JSON schema's type property value must be a single string type.
        In your case, you have to change it to an "oneOf" type which 
        represents an union type.

        So, please change the value as below:

        \`\`\`
        {
          oneOf: [
        ${e.value.type.map((t) => `    { "type": ${JSON.stringify(t)}, ... },`).join("\n")}
          ],${"description" in e.value ? `\n  description: ${JSON.stringify(e.value.description)},` : ""}
        }
        \`\`\`
      `;
    }
};
