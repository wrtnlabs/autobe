import { ITraceable } from "./AutoBeAnalyzeDocumentTraceable";

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
  fields: Array<
    {
      /** Field name (e.g., "title", "email", "price") */
      name: string;
      /** Owning entity (e.g., "Article", "User", "Product") */
      entity: string;
      /** Business data type (e.g., "string", "email", "currency", "integer") */
      dataType: string;
      /** Constraint list */
      constraints: Array<{
        /** Constraint type */
        kind: "format" | "range" | "length" | "enum" | "required" | "unique";
        /**
         * Constraint value (e.g., "5-200", "RFC 5322",
         * "active|inactive|deleted")
         */
        value: string;
      }>;
      /** Validation rules (natural language description) */
      validationRules: string[];
    } & ITraceable
  >;
}
