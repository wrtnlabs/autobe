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
      // x-autobe-database-schema in properties
      isInvalidJsonSchema(e) &&
      e.path.endsWith(`.properties["x-autobe-database-schema"]`) === true &&
      typeof e.value === "string"
    ) {
      const expected: string = `AutoBeOpenApi.IJsonSchemaDescriptive.IObject["x-autobe-database-schema"]`;
      const actual: string = `AutoBeOpenApi.IJsonSchemaDescriptive.IObject.properties["x-autobe-database-schema"]`;
      const correctPlace: string = e.path.replace(
        `.properties["x-autobe-database-schema"]`,
        `["x-autobe-database-schema"]`,
      );

      e.expected = "undefined";
      e.description = StringUtil.trim`
        You have placed "x-autobe-database-schema" in the wrong location.

        **Type System Violation**:
        - You defined: \`${actual}\` (as a field inside properties)
        - Required type: \`${expected}\` (as metadata at object type level)

        The "x-autobe-database-schema" is NOT a regular field that appears in the
        object's properties, but a METADATA annotation that describes which database
        table this schema type corresponds to. In the AutoBE type system, metadata
        properties must be defined at the object type level, outside of "properties".

        **Current (Wrong)**:
        \`\`\`json
        {
          "type": "object",
          "properties": {
            ...,
            "x-autobe-database-schema": ${JSON.stringify(e.value)}  // ❌ Wrong: inside properties
          },
          ...
        }
        \`\`\`

        **Correct**:
        \`\`\`json
        {
          "type": "object",
          "x-autobe-database-schema": ${JSON.stringify(e.value)},  // ✅ Correct: metadata level
          "properties": { ... },
          ...
        }
        \`\`\`

        **Action Required**:
        1. Remove "x-autobe-database-schema" from: ${e.path}
        2. Place it at the correct location: ${correctPlace}

        This is a structural requirement enforced by the AutoBE type system.
        The compiler will continue to reject this schema until corrected.
      `;
    } else if (
      // required in properties
      isInvalidJsonSchema(e) &&
      e.path.endsWith(`.properties.required`) === true &&
      Array.isArray(e.value) === true
    ) {
      const expected: string = `AutoBeOpenApi.IJsonSchemaDescriptive.IObject.required`;
      const actual: string = `AutoBeOpenApi.IJsonSchemaDescriptive.IObject.properties.required`;
      const correctPlace: string = e.path.replace(
        `.properties.required`,
        `.required`,
      );

      e.expected = "undefined";
      e.description = StringUtil.trim`
        You have placed "required" in the wrong location.

        **Type System Violation**:
        - You defined: \`${actual}\` (as a field inside properties)
        - Required type: \`${expected}\` (as metadata at object type level)

        The "required" property is NOT a field of the object type, but a METADATA
        array that lists which properties are mandatory. In the AutoBE type system,
        schema metadata must be defined at the object type level, outside of "properties".

        **Current (Wrong)**:
        \`\`\`json
        {
          "type": "object",
          "properties": {
            ...,
            "required": ${JSON.stringify(e.value)}  // ❌ Wrong: inside properties
          },
          ...
        }
        \`\`\`

        **Correct**:
        \`\`\`json
        {
          "type": "object",
          "properties": { ... },
          "required": ${JSON.stringify(e.value)},  // ✅ Correct: metadata level
          ...
        }
        \`\`\`

        **Action Required**:
        1. Remove "required" from: ${e.path}
        2. Place it at the correct location: ${correctPlace}

        This is a structural requirement enforced by the AutoBE type system.
        The compiler will continue to reject this schema until corrected.
      `;
    } else if (
      isInvalidJsonSchema(e) &&
      e.path.endsWith(`.properties.description`) === true &&
      typeof e.value === "string"
    ) {
      const expected: string = `AutoBeOpenApi.IJsonSchemaDescriptive.IObject.description`;
      const actual: string = `AutoBeOpenApi.IJsonSchemaDescriptive.IObject.properties.description`;
      const correctPlace: string = e.path.replace(
        `.properties.description`,
        `.description`,
      );

      e.expected = "undefined";
      e.description = StringUtil.trim`
        You have placed "description" in the wrong location.

        **Type System Violation**:
        - You defined: \`${actual}\` (as a field inside properties)
        - Required type: \`${expected}\` (as metadata at object type level)

        The "description" property is NOT a field of the object type, but a METADATA
        string that describes the entire schema. In the AutoBE type system, schema
        metadata must be defined at the object type level, outside of "properties".

        **Current (Wrong)**:
        \`\`\`json
        {
          "type": "object",
          "properties": {
            ...,
            "description": ${JSON.stringify(e.value)}  // ❌ Wrong: inside properties
          },
          ...
        }
        \`\`\`

        **Correct**:
        \`\`\`json
        {
          "type": "object",
          "description": ${JSON.stringify(e.value)},  // ✅ Correct: metadata level
          "properties": { ... },
          ...
        }
        \`\`\`

        **Action Required**:
        1. Remove "description" from: ${e.path}
        2. Place it at the correct location: ${correctPlace}

        This is a structural requirement enforced by the AutoBE type system.
        The compiler will continue to reject this schema until corrected.
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
