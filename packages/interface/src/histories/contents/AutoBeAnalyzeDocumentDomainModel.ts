import { ITraceable } from "./AutoBeAnalyzeDocumentTraceable";

/**
 * Attribute of a domain entity.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentDomainModelAttribute {
  /** Attribute name */
  name: string;
  /** Business data type (e.g., "email", "currency", "text(5-200)") */
  type: string;
  /** Constraints (e.g., "required", "unique", "min 50 chars") */
  constraints: string[];
}

/**
 * Domain entity definition.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentDomainModelEntity extends ITraceable {
  /** Entity name */
  name: string;
  /** Entity description */
  description: string;
  /** Key attributes */
  attributes: Array<AutoBeAnalyzeDocumentDomainModelAttribute>;
  /** Business rules */
  businessRules: string[];
  /** Lifecycle states (e.g., ["active", "banned", "deleted"]) */
  lifecycleStates?: string[];
}

/**
 * Relationship between domain entities.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentDomainModelRelationship extends ITraceable {
  /** Source entity */
  from: string;
  /** Target entity */
  to: string;
  /** Relationship type */
  kind: "one-to-one" | "one-to-many" | "many-to-many";
  /** Relationship description */
  description: string;
}

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
  entities: Array<AutoBeAnalyzeDocumentDomainModelEntity>;

  /** Relationships between entities */
  relationships: Array<AutoBeAnalyzeDocumentDomainModelRelationship>;
}
