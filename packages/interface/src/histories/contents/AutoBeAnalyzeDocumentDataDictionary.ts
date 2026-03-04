import { ITraceable } from "./AutoBeAnalyzeDocumentTraceable";

/**
 * Constraint on a data dictionary field.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentDataDictionaryConstraint {
  /** Constraint type */
  kind: "format" | "range" | "length" | "enum" | "required" | "unique";
  /** Constraint value (e.g., "5-200", "RFC 5322", "active|inactive|deleted") */
  value: string;
}

/**
 * Data dictionary field definition.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentDataDictionaryField extends ITraceable {
  /** Field name (e.g., "title", "email", "price") */
  name: string;
  /** Owning entity (e.g., "Article", "User", "Product") */
  entity: string;
  /** Business data type (e.g., "string", "email", "currency", "integer") */
  dataType: string;
  /** Constraint list */
  constraints: Array<AutoBeAnalyzeDocumentDataDictionaryConstraint>;
  /** Validation rules (natural language description) */
  validationRules: string[];
}

/**
 * Extension category: Data Dictionary.
 *
 * Structures per-field constraints/validation rules as **direct input** to the
 * DB/Interface Phase.
 *
 * Optional category: selected for projects with complex data constraints.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentDataDictionary {
  /** Field definition list */
  fields: Array<AutoBeAnalyzeDocumentDataDictionaryField>;
}
