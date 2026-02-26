import { ITraceable } from "./AutoBeAnalyzeDocumentTraceable";

/**
 * Extension category: Domain Model.
 *
 * Structures entities/relationships/business rules as **direct input** to the
 * DB Phase. Consumed as structured data without re-extracting entity
 * information from markdown.
 *
 * Optional category: selected for projects with complex domain models.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentDomainModel {
  /** Domain entity list */
  entities: Array<
    {
      /** Entity name */
      name: string;
      /** Entity description */
      description: string;
      /** Key attributes */
      attributes: Array<{
        /** Attribute name */
        name: string;
        /** Business data type (e.g., "email", "currency", "text(5-200)") */
        type: string;
        /** Constraints (e.g., "required", "unique", "min 50 chars") */
        constraints: string[];
      }>;
      /** Business rules */
      businessRules: string[];
      /** Lifecycle states (e.g., ["active", "banned", "deleted"]) */
      lifecycleStates?: string[];
    } & ITraceable
  >;

  /** Relationships between entities */
  relationships: Array<
    {
      /** Source entity */
      from: string;
      /** Target entity */
      to: string;
      /** Relationship type */
      kind: "one-to-one" | "one-to-many" | "many-to-many";
      /** Relationship description */
      description: string;
    } & ITraceable
  >;
}
