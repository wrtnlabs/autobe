/**
 * A directed edge in the schema reference graph.
 *
 * Represents a property in `sourceType` that references `targetType` via
 * `$ref`. Self-references (sourceType === targetType) are excluded from cycle
 * detection — they represent legitimate tree structures.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaDecoupleEdge {
  /** Schema type that contains the referencing property. */
  sourceType: string;

  /** Property name within the source type that holds the reference. */
  propertyName: string;

  /** Schema type being referenced (the `$ref` target). */
  targetType: string;
}
