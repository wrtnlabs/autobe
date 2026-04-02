/**
 * A property removal that breaks a circular reference cycle.
 *
 * Produced by the LLM Decouple agent after analyzing cross-type
 * circular references and choosing which edge to cut based on
 * semantic importance, reference direction, and DTO purpose.
 *
 * After removing a property, the schema's `description` and
 * `x-autobe-specification` may become inconsistent. The agent
 * provides updated text to maintain accuracy.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaDecoupleRemoval {
  /** Schema type that owns the property to remove. */
  typeName: string;

  /** Property name to delete from the schema. */
  propertyName: string;

  /** Reason for removing this specific edge. */
  reason: string;

  /**
   * Updated description for the schema after property removal.
   *
   * The schema's `description` field may reference the removed property.
   * Provide a corrected description that accurately reflects the schema
   * WITHOUT the removed property. This text appears in Swagger UI.
   */
  updatedDescription: string;

  /**
   * Updated specification for the schema after property removal.
   *
   * The schema's `x-autobe-specification` may reference the removed
   * property. Provide corrected implementation guidance that does NOT
   * mention the removed property. This text guides Realize/Test agents.
   */
  updatedSpecification: string;
}
