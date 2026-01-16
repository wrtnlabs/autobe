import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";

/**
 * Replace an existing property's schema definition.
 *
 * Use when property type, format, or structure is incorrect.
 * For nullability-only changes, use `nullish` instead.
 */
export interface AutoBeInterfaceSchemaPropertyUpdate {
  type: "update";

  /** Reason for replacing this property's schema. */
  reason: string;

  /** Current property key to update. */
  key: string;

  /**
   * New property key after update.
   *
   * - `null`: Keep the same key
   * - `string`: Rename property (used for FK-to-object transformation)
   */
  newKey: string | null;

  /** New schema definition that replaces the existing one. */
  schema: Exclude<
    AutoBeOpenApi.IJsonSchemaDescriptive,
    AutoBeOpenApi.IJsonSchemaDescriptive.IObject
  >;

  /** Whether property should be in `required` array. */
  required: boolean;
}
