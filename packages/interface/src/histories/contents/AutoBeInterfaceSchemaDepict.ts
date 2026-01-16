/**
 * Command to update a description within a DTO schema.
 *
 * This type represents a single atomic description enhancement operation
 * that targets either the schema-level description or a specific property's
 * description. Multiple depiction commands can be applied sequentially to
 * improve overall documentation quality.
 *
 * ## Target Selection
 *
 * The `key` field determines what gets updated:
 *
 * ```typescript
 * // Update schema-level description
 * { key: null, value: "Multi-paragraph schema docs...", reason: "..." }
 *
 * // Update property description
 * { key: "email", value: "User's email address...", reason: "..." }
 * ```
 *
 * ## Important Constraints
 *
 * Depiction commands can ONLY modify `description` fields. They cannot:
 * - Add or remove properties
 * - Change property types, formats, or $refs
 * - Modify the `required` array
 * - Create new schema types
 *
 * Structural modifications require {@link AutoBeInterfaceSchemaPropertyRevise}
 * commands instead.
 *
 * ## Description Quality Standards
 *
 * ### Schema Descriptions
 * - First line: Brief summary sentence
 * - Additional paragraphs: Detailed explanation, relationships, usage
 * - Separate paragraphs with `\n\n` (one blank line)
 *
 * ### Property Descriptions
 * - Explain the field's purpose (not just repeat the name)
 * - Include business rules and validation constraints
 * - Document format requirements and examples when helpful
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaDepict {
  /**
   * Brief explanation of why this description is being updated.
   *
   * Unlike property revisions which require detailed justification,
   * depiction reasons can be brief since description improvements are
   * generally straightforward quality enhancements.
   */
  reason: string;

  /**
   * Target for the description update.
   *
   * - `null`: Update the schema-level `description` field
   * - `string`: Update `properties[key].description` for the named property
   *
   * When targeting a property, the key must exist in the schema's
   * properties object (after property revisions have been applied).
   */
  key: string | null;

  /**
   * New description text to set.
   *
   * This value completely replaces the existing description. For schema
   * descriptions, this should be comprehensive multi-paragraph documentation.
   * For property descriptions, this should clearly explain the field's
   * purpose, constraints, and business context.
   *
   * **Writing guidelines**:
   * - First sentence: Brief summary of purpose
   * - Additional sentences: Details, constraints, examples
   * - Multiple paragraphs: Separate with `\n\n` when needed
   * - Language: English only
   */
  value: string;
}
