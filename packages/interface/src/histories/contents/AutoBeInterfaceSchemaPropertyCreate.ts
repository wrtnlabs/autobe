import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";

/**
 * Revision command to add a new property to a DTO schema.
 *
 * This revision type represents an atomic "create property" operation applied
 * during schema property review. The command includes the complete schema
 * definition for the new property, ensuring proper type mapping and
 * documentation from the first insertion.
 *
 * ## When This Revision is Used
 *
 * ### Content Completeness
 * Database field exists in Prisma schema but was omitted from DTO:
 * ```prisma
 * model User {
 *   verified Boolean @default(false)  // Missing in generated IUser
 * }
 * ```
 *
 * ### Relation Mapping
 * Foreign key relation should be exposed as an object reference:
 * ```typescript
 * // Add "author" property with $ref to IUser.ISummary
 * ```
 *
 * ### Computed/Aggregation Fields
 * Derived fields that don't exist as database columns:
 * ```typescript
 * // Add "_count.comments" for aggregation support
 * // Add "averageRating" computed from related reviews
 * ```
 *
 * ## Required vs Optional Fields
 *
 * The `required` field determines whether the new property is added to
 * the schema's `required` array. Rules differ by DTO type:
 *
 * - **Read DTOs** (IEntity, ISummary): Match database nullability
 * - **Create DTOs**: Only `true` for non-nullable, non-@default fields
 * - **Update DTOs**: Always `false` (all fields optional)
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaPropertyCreate {
  /**
   * Discriminator identifying this as a property creation command.
   */
  type: "create";

  /**
   * Human-readable explanation of why this property is being added.
   *
   * Should describe the specific issue that necessitates adding this field.
   * Examples:
   * - "Database field 'verified' exists but was missing from IUser"
   * - "Foreign key relation 'author' needs to be exposed in IBbsArticle"
   * - "Computed field '_count.comments' for aggregation support"
   */
  reason: string;

  /**
   * Property key (name) to add to the schema's properties object.
   *
   * This becomes the key in `schema.properties[key]`. Must follow the
   * project's naming conventions (typically camelCase for DTO properties).
   */
  key: string;

  /**
   * Complete JSON schema definition for the new property.
   *
   * Contains the type definition, format, description, and any other
   * metadata needed for the property. This schema will be set as
   * `schema.properties[key] = schema`.
   */
  schema: AutoBeOpenApi.IJsonSchemaDescriptive;

  /**
   * Whether the property should be added to the `required` array.
   *
   * - `true`: Property is non-nullable and must be present (add to required)
   * - `false`: Property is optional and may be omitted (not in required)
   *
   * For Read DTOs, this should match database nullability.
   * For Request DTOs, nullable and @default fields should be `false`.
   */
  required: boolean;
}
