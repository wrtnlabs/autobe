import { StringUtil } from "@autobe/utils";
import { IValidation } from "typia";

export const fulfillJsonSchemaErrorMessages = (
  errors: IValidation.IError[],
): void => {
  for (const e of errors)
    if (
      // type := ["number", "string", ...] case
      isInvalidJsonSchema(e) &&
      typeof e.value === "object" &&
      e.value !== null &&
      "type" in e.value &&
      Array.isArray(e.value.type)
    )
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
    else if (
      isInvalidJsonSchema(e) &&
      typeof e.value === "object" &&
      e.value !== null &&
      "enum" in e.value &&
      Array.isArray(e.value.enum)
    )
      e.description = StringUtil.trim`
        You have defined only enum property, but it is not allowed in the 
        JSON schema. You have to define it as oneOf type containing multiple
        const types like below:
        
        \`\`\`
        {
          oneOf: [
        ${e.value.enum.map((t) => `    { "const": ${JSON.stringify(t)} },`).join("\n")}
          ],${"description" in e.value ? `\n  description: ${JSON.stringify(e.value.description)},` : ""}
        }
        \`\`\`
      `;
    else if (e.value === undefined && e.path.endsWith(".description"))
      // no description
      e.description = StringUtil.trim`
        You have missed the "description" property in the JSON schema. 
        
        Please fill it with detailed description about the type.
      `;
    else if (
      e.value === undefined &&
      e.path.endsWith(".required") &&
      e.expected === "Array<string>"
    )
      e.description = StringUtil.trim`
        You have missed the "required" property in the JSON schema of object type.

        When defining the object type, you have to fill the "required" property
        which lists up the every required property names.

        Please fill it with the required fields. If you think that there is
        not any required fields at all, you still have to fill the 
        "required" property even though it becomes an empty array.
      `;
};

const isInvalidJsonSchema = (e: IValidation.IError): boolean =>
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
    );
