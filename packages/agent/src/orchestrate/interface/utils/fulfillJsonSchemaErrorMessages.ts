import { StringUtil } from "@autobe/utils";
import typia, { IValidation } from "typia";

export const fulfillJsonSchemaErrorMessages = (
  errors: IValidation.IError[],
): void => {
  for (const e of errors)
    fulfillTypeAsArrayError(e) ||
      fulfillEnumInsteadOfConstError(e) ||
      fulfillNoDescriptionError(e) ||
      fulfillNoRequiredError(e) ||
      fulfillObjectMetadataMisplacement(e) ||
      fulfillNestedObjectError(e);
};

const fulfillTypeAsArrayError = (e: IValidation.IError): boolean => {
  if (
    // type := ["number", "string", ...] case
    isInvalidJsonSchema(e) &&
    typia.is<{ type: string[] }>(e.value) === true
  ) {
    e.description = StringUtil.trim`
      You have defined the JSON schema's type property value as an 
      array type listing all the types that you want, but this is not 
      allowed in the JSON schema.
      
      The JSON schema's type property value must be a single string type.
      In your case, you have to change it to an "oneOf" type which 
      represents a union type.

      So, please change the value as below:

      \`\`\`
      {
        oneOf: [
      ${e.value.type.map((t) => `    { "type": ${JSON.stringify(t)}, ... },`).join("\n")}
        ],${"description" in e.value ? `\n  description: ${JSON.stringify(e.value.description)},` : ""}
      }
      \`\`\`
    `;
    return true;
  }
  return false;
};

const fulfillEnumInsteadOfConstError = (e: IValidation.IError): boolean => {
  if (
    // enum to const
    isInvalidJsonSchema(e) &&
    typia.is<{ enum: any[] }>(e.value) === true
  ) {
    e.description = StringUtil.trim`
      You have defined an enum property, but it is not allowed in the 
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
    return true;
  }
  return false;
};

const fulfillNoDescriptionError = (e: IValidation.IError): boolean => {
  if (e.value === undefined && e.path.endsWith(".description")) {
    // no description
    e.description = StringUtil.trim`
      You have missed the "description" property in the JSON schema. 
      
      Please fill it with detailed description about the type.
    `;
    return true;
  }
  return false;
};

const fulfillNoRequiredError = (e: IValidation.IError): boolean => {
  if (
    // no required property
    e.value === undefined &&
    e.path.endsWith(".required") &&
    e.expected === "Array<string>"
  ) {
    e.description = StringUtil.trim`
      You have missed the "required" property in the JSON schema of object type.

      When defining the object type, you have to fill the "required" property
      which lists all the required property names.

      Please fill it with the required fields. If you think that there is
      not any required fields at all, you still have to fill the 
      "required" property even though it becomes an empty array.
    `;
    return true;
  }
  return false;
};

const fulfillObjectMetadataMisplacement = (e: IValidation.IError): boolean => {
  if (isInvalidJsonSchema(e) === false) return false;

  const validate = (props: {
    key: string;
    expected: string;
    actual: string;
    place: string;
    purpose: string;
  }): boolean => {
    e.expected = "undefined";
    e.description = StringUtil.trim`
      You have placed "${props.key}" in the wrong location.

      **Type System Violation**:
      - You defined: \`${props.actual}\` (as a field inside properties)
      - Required type: \`${props.expected}\` (as metadata at object type level)

      The "${props.key}" is NOT a regular field that appears in the
      object's properties, but a METADATA annotation that describes ${props.purpose}. 
      In the AutoBE type system, metadata properties must be defined at the 
      object type level, outside of "properties".

      **Current (Wrong)**:
      \`\`\`json
      {
        "type": "object",
        "properties": {
          ...,
          "${props.key}": ${JSON.stringify(e.value)}  // ❌ Wrong: inside properties
        },
        ...
      }
      \`\`\`

      **Correct**:
      \`\`\`json
      {
        "type": "object",
        "${props.key}": ${JSON.stringify(e.value)},  // ✅ Correct: metadata level
        "properties": { ... },
        ...
      }
      \`\`\`

      **Action Required**:
      1. Remove "${props.key}" from: ${e.path}
      2. Place it at the correct location: ${props.place}

      This is a structural requirement enforced by the AutoBE type system.
      The compiler will continue to reject this schema until corrected.
    `;
    return true;
  };

  if (
    e.path.endsWith(`.properties["x-autobe-database-schema"]`) === true &&
    typeof e.value === "string"
  )
    return validate({
      key: "x-autobe-database-schema",
      expected: `AutoBeOpenApi.IJsonSchemaDescriptive.IObject["x-autobe-database-schema"]`,
      actual: `AutoBeOpenApi.IJsonSchemaDescriptive.IObject.properties["x-autobe-database-schema"]`,
      place: e.path.replace(
        `.properties["x-autobe-database-schema"]`,
        `["x-autobe-database-schema"]`,
      ),
      purpose: "which database table this schema type corresponds to",
    });
  else if (
    e.path.endsWith(`.properties.required`) === true &&
    Array.isArray(e.value) === true
  )
    return validate({
      key: "required",
      expected: `AutoBeOpenApi.IJsonSchemaDescriptive.IObject.required`,
      actual: `AutoBeOpenApi.IJsonSchemaDescriptive.IObject.properties.required`,
      place: e.path.replace(`.properties.required`, `.required`),
      purpose: "which properties are mandatory",
    });
  else if (
    e.path.endsWith(`.properties.description`) === true &&
    typeof e.value === "string"
  )
    return validate({
      key: "description",
      expected: `AutoBeOpenApi.IJsonSchemaDescriptive.IObject.description`,
      actual: `AutoBeOpenApi.IJsonSchemaDescriptive.IObject.properties.description`,
      place: e.path.replace(`.properties.description`, `.description`),
      purpose: "the entire schema",
    });
  return false;
};

const fulfillNestedObjectError = (e: IValidation.IError): boolean => {
  if (isExcludedObjectType(e) === true) {
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
    return true;
  }
  return false;
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
