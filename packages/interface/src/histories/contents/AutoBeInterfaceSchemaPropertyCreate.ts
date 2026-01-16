import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";

/**
 * Add a new property to a DTO schema.
 *
 * Use when a database field or relation reference is missing from the schema.
 */
export interface AutoBeInterfaceSchemaPropertyCreate {
  type: "create";

  /** Reason for adding this property. */
  reason: string;

  /** Property key to add. */
  key: string;

  /** Schema definition for the new property. */
  schema: Exclude<
    AutoBeOpenApi.IJsonSchemaDescriptive,
    AutoBeOpenApi.IJsonSchemaDescriptive.IObject
  >;

  /** Whether property should be in `required` array. */
  required: boolean;
}
