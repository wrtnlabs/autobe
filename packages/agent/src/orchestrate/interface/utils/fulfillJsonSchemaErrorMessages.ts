import { StringUtil } from "@autobe/utils";
import typia, { IValidation } from "typia";

export const fulfillJsonSchemaErrorMessages = (
  errors: IValidation.IError[],
): void => {
  for (const e of errors)
    if (
      // type := ["number", "string", ...] case
      isInvalidJsonSchema(e) &&
      typia.is<{ type: string[] }>(e.value) === true
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
      typia.is<{ enum: any[] }>(e.value) === true
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
    else if (isExcludedObjectType(e) === true)
      e.description = StringUtil.trim`
        Nested inline object type definitions are not allowed in AutoBE.

        All object types must be defined as named schemas in the components section
        and referenced using $ref. This enforces the DRY principle, improves reusability,
        and maintains AutoBE's simplified AST structure for AI generation clarity.

        Instead of defining an inline object, create a new named type in components.schemas
        with an interface-style name (starting with 'I'), then reference it with $ref.

        For example, instead of:

        \`\`\`typescript
        {
          "type": "array",
          "items": { "type": "object", "properties": {...} }  // ❌ Wrong
        }
        \`\`\`

        Define a named type and reference it:

        \`\`\`typescript
        // In components.schemas
        "IUserSummary": { 
          "type": "object", 
          "properties": {...} 
        }

        // Then reference it
        {
          "type": "array",
          "items": { "$ref": "#/components/schemas/IUserSummary" }  // ✅ Correct
        }
        \`\`\`

        This applies to array items, object properties, additionalProperties, 
        and oneOf variants. Change the inline object definition to a named schema 
        reference at the next time.
      `;
};

const isExcludedObjectType = (error: IValidation.IError): boolean =>
  error.expected.includes("|") &&
  ((error.expected.includes("AutoBeOpenApi.IJsonSchema.IConstant") &&
    error.expected.includes("AutoBeOpenApi.IJsonSchema.IArray")) ||
    (error.expected.includes(
      "AutoBeOpenApi.IJsonSchemaDescriptive.IConstant",
    ) &&
      error.expected.includes(
        "AutoBeOpenApi.IJsonSchemaDescriptive.IArray",
      ))) &&
  typia.is<{
    type: "object";
  }>(error.value) === true;

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
