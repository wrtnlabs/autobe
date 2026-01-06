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
      // enum to const
      isInvalidJsonSchema(e) &&
      typia.is<{ enum: any[] }>(e.value) === true
    )
      e.description = StringUtil.trim`
        You have defined enum property, but it is not allowed in the 
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
      // no required property
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
      // nested object
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
    else if (
      isInvalidJsonSchema(e) &&
      e.path.endsWith(`.properties["x-autobe-database-schema"]`) === true
    ) {
      const expected: string = `AutoBeOpenApi.IJsonSchemaDescriptive.IObject["x-autobe-database-schema"]`;
      const actual: string = `AutoBeOpenApi.IJsonSchemaDescriptive.IObject.properties["x-autobe-database-schema"]`;
      const correctPlace: string = e.path.replace(
        `.properties["x-autobe-database-schema"]`,
        `["x-autobe-database-schema"]`,
      );

      e.expected = "undefined";
      e.description = StringUtil.trim`
        Your intention was to defining \`${expected}\` to explain the 
        current object type is related to a database schema ${e.value},
        but you actually defined it under the \`${actual}\` place.

        Erase current ${e.path} property, and re-define the ${JSON.stringify(e.value)} 
        value under the ${correctPlace} place. Note that, "x-autobe-database-schema" 
        is not a member field of an object type, but a metadata describing the 
        object type.

        Don't mind. This is a little bit minor mistake. Just fix it quickly 
        just by moving the ${JSON.stringify(e.value)} value to the correct place 
        ${correctPlace}. 
        
        Note that, this is not a recommendation, but an instruction you must obey.
      `;
    }
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
