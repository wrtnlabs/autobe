/**
 * A property removal that breaks a circular reference cycle.
 *
 * Produced by the LLM Decouple agent after analyzing cross-type circular
 * references and choosing which edge to cut based on semantic importance,
 * reference direction, and DTO purpose.
 *
 * Fields are ordered for chain-of-thought generation:
 *
 * 1. `reason` — commit to WHY first
 * 2. `typeName` / `propertyName` — then commit to WHAT
 * 3. `description` / `specification` — finally update docs if needed
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaDecoupleRemoval {
  /**
   * Reason for removing this specific edge.
   *
   * Written first so the LLM commits to the rationale before deciding which
   * exact property to remove.
   */
  reason: string;

  /** Schema type that owns the property to remove. */
  typeName: string;

  /** Property name to delete from the schema. */
  propertyName: string;

  /**
   * Updated `description` for the schema identified by `typeName`, or `null` if
   * the existing description does not reference the removed property and needs
   * no change.
   */
  description: string | null;

  /**
   * Updated `x-autobe-specification` for the schema identified by `typeName`,
   * or `null` if the existing specification does not reference the removed
   * property and needs no change.
   */
  specification: string | null;
}
