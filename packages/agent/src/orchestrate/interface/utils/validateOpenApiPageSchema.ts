// import { AutoBeOpenApi } from "@autobe/interface";
// import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
// import { IValidation } from "typia";

// export const validateOpenApiPageSchema = (props: {
//   errors: IValidation.IError[];
//   path: string;
//   key: string;
//   schema: AutoBeOpenApi.IJsonSchemaDescriptive;
// }): void => {
//   if (
//     props.key.startsWith("IPage") === false ||
//     props.key === "IPage" ||
//     props.key.startsWith("IPage.")
//   )
//     return;

//   const childName: string = props.key.substring("IPage".length);
//   if (AutoBeOpenApiTypeChecker.isObject(props.schema) === false) {
//     props.errors.push({
//       path: `${props.path}[${JSON.stringify(props.key)}]`,
//       value: props.schema,
//       expected: "AutoBeOpenApi.IJsonSchemaDescriptive.IObject",
//       description: StringUtil.trim`
//           Following the system prompt, "${props.key}" type must be constructed like below.

//           However, you have not defined the below like object type.
//           At the next trial, please ensure to follow the structure exactly as shown.

//           ${getExampleJsonSchema(childName)}
//         `,
//     });
//     return;
//   }

//   const properties: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
//     props.schema.properties;
//   const required: string[] = props.schema.required;

//   //----
//   // CHILDREN DATA
//   //----
//   if (properties.data === undefined)
//     props.errors.push({
//       path: `${props.path}[${JSON.stringify(props.key)}].properties.data`,
//       value: undefined,
//       expected: "AutoBeOpenApi.IJsonSchemaDescriptive.IArray",
//       description: StringUtil.trim`
//         Following the system prompt, "${props.key}" type must have a property
//         "data" as an array type like below.

//         However, you have not defined the "data" property at all.
//         Please ensure to follow the structure exactly as shown.

//         ${getExampleJsonSchema(childName, (o) => o.properties.data)}
//       `,
//     });
//   else {
//     if (AutoBeOpenApiTypeChecker.isArray(properties.data) === false)
//       props.errors.push({
//         path: `${props.path}[${JSON.stringify(props.key)}].properties.data`,
//         value: properties.data,
//         expected: "AutoBeOpenApi.IJsonSchemaDescriptive.IArray",
//         description: StringUtil.trim`
//           Following the system prompt, "${props.key}" type must have an array typed
//           property "data" like below.

//           However, you have not defined the "data" property as an array type.
//           Please ensure to follow the structure exactly as shown.

//           ${getExampleJsonSchema(childName, (o) => o.properties.data)}
//         `,
//       });
//     else if (
//       AutoBeOpenApiTypeChecker.isReference(properties.data.items) === false
//     )
//       props.errors.push({
//         path: `${props.path}[${JSON.stringify(props.key)}].properties.data.items`,
//         value: properties.data.items,
//         expected: "AutoBeOpenApi.IJsonSchemaDescriptive.IReference",
//         description: StringUtil.trim`
//           Following the system prompt, "${props.key}" type must have an array
//           typed property "data", and its items must be an reference type like below.

//           However, you have not defined the "data.items" property as an reference type.
//           Please ensure to follow the structure exactly as shown.

//           ${getExampleJsonSchema(childName, (o) => o.properties.data.items)}
//         `,
//       });
//     else if (properties.data.items.$ref !== `#/components/schemas/${childName}`)
//       props.errors.push({
//         path: `${props.path}[${JSON.stringify(props.key)}].properties.data.items.$ref`,
//         value: properties.data.items.$ref,
//         expected: JSON.stringify(`#/components/schemas/${childName}`),
//         description: StringUtil.trim`
//           Following the system prompt, "${props.key}" type must have an array
//           typed property "data", and its items must be an reference type pointing
//           the "${childName}" type.

//           However, you have not defined the "data.items" property as an reference
//           type pointing the "${childName}" type. Please ensure to follow the
//           structure exactly as shown.

//           ${getExampleJsonSchema(childName, (o) => o.properties.data.items.$ref)}
//         `,
//       });
//     if (required.includes("data") === false)
//       props.errors.push({
//         path: `${props.path}[${JSON.stringify(props.key)}].required`,
//         value: required,
//         expected: `"data" must be included in the required array.`,
//         description: StringUtil.trim`
//           Following the system prompt, "${props.key}" type must have a property
//           "data" as a required field like below.

//           However, you have not defined the "data" property as a required field.
//           Please ensure to follow the structure exactly as shown.

//           ${getExampleJsonSchema(childName, (o) => o.required)}
//         `,
//       });
//   }

//   // PAGINATION
//   if (properties.pagination === undefined) {
//     props.errors.push({
//       path: `${props.path}[${JSON.stringify(props.key)}].properties.pagination`,
//       value: undefined,
//       expected: "AutoBeOpenApi.IJsonSchemaDescriptive.IReference",
//       description: StringUtil.trim`
//         Following the system prompt, "${props.key}" type must have a property
//         "pagination" as a reference type like below.

//         However, you have not defined the "pagination" property at all.
//         Please ensure to follow the structure exactly as shown.

//         ${getExampleJsonSchema(childName, (o) => o.properties.pagination)}
//       `,
//     });
//   } else {
//     if (AutoBeOpenApiTypeChecker.isReference(properties.pagination) === false) {
//       props.errors.push({
//         path: `${props.path}[${JSON.stringify(props.key)}].properties.pagination`,
//         value: undefined,
//         expected: "AutoBeOpenApi.IJsonSchemaDescriptive.IReference",
//         description: StringUtil.trim`
//           Following the system prompt, "${props.key}" type must have a property
//           "pagination" as a reference type like below.

//           However, you have not defined the "pagination" property as a reference type.
//           Please ensure to follow the structure exactly as shown.

//           ${getExampleJsonSchema(childName, (o) => o.properties.pagination)}
//         `,
//       });
//     } else if (
//       properties.pagination.$ref !== "#/components/schemas/IPage.IPagination"
//     ) {
//       props.errors.push({
//         path: `${props.path}[${JSON.stringify(props.key)}].properties.pagination.$ref`,
//         value: properties.pagination.$ref,
//         expected: JSON.stringify("#/components/schemas/IPage.IPagination"),
//         description: StringUtil.trim`
//           Following the system prompt, "${props.key}" type must have a property
//           "pagination" as a reference type pointing the "IPage.IPagination" type
//           like below.

//           However, you have not defined the "pagination" property as a reference
//           type pointing the "IPage.IPagination" type. Please ensure to follow the
//           structure exactly as shown.

//           ${getExampleJsonSchema(childName, (o) => o.properties.pagination.$ref)}
//         `,
//       });
//     }
//     if (required.includes("pagination") === false)
//       props.errors.push({
//         path: `${props.path}[${JSON.stringify(props.key)}].required`,
//         value: props.schema.required,
//         expected: `"pagination" must be included in the required array.`,
//         description: StringUtil.trim`
//           Following the system prompt, "${props.key}" type must have a property
//           "pagination" as a required field like below.

//           However, you have not defined the "pagination" property as a required
//           field. Please ensure to follow the structure exactly as shown.

//           ${getExampleJsonSchema(childName, (o) => o.required)}
//         `,
//       });
//   }
// };

// const getExampleJsonSchema = (
//   childName: string,
//   closure?: (value: ReturnType<typeof getExampleValue>) => any,
// ): string => {
//   const value = {
//     type: "object",
//     properties: {
//       data: {
//         type: "array",
//         items: {
//           $ref: `#/components/schemas/${childName}`,
//         },
//         description: "<SOME_DESCRIPTION>",
//       },
//       pagination: {
//         $ref: "#/components/schemas/IPage.IPagination",
//         description: "<SOME_DESCRIPTION>",
//       },
//     },
//     required: ["data", "pagination"],
//     description: "<SOME_DESCRIPTION>",
//   } satisfies AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
//   return StringUtil.trim`
//     > Change the value as below.
//     >
//     > \`\`\`json
//     ${JSON.stringify((closure ?? ((v) => v))(value), null, 2)
//       .split("\n")
//       .map((s) => `> ${s}`)
//       .join("\n")}
//     > \`\`\`
//   `;
// };

// const getExampleValue = (childName: string) =>
//   ({
//     type: "object",
//     properties: {
//       data: {
//         type: "array",
//         items: {
//           $ref: `#/components/schemas/${childName}`,
//         },
//         description: "<SOME_DESCRIPTION>",
//       },
//       pagination: {
//         $ref: "#/components/schemas/IPage.IPagination",
//         description: "<SOME_DESCRIPTION>",
//       },
//     },
//     required: ["data", "pagination"],
//     description: "<SOME_DESCRIPTION>",
//   }) satisfies AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
