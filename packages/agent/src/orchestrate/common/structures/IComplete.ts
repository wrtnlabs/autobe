/**
 * Shared completion request for cyclinic write-validate-correct loops.
 *
 * Used across all phases that employ the write → validate → correct pattern.
 * Only available after a write submission has passed external validation (union
 * narrowing removes this type until then).
 *
 * @author Samchon
 */
export interface IComplete {
  /** Type discriminator for completion request. */
  type: "complete";
}
