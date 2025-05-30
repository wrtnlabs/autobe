import { AutoBePrisma } from "./AutoBePrisma";

/**
 * Union type representing the result of Prisma schema validation.
 *
 * This type encapsulates the outcome of validating an AutoBePrisma.IApplication
 * structure against Prisma schema rules and business constraints. The
 * validation process checks for structural integrity, referential consistency,
 * naming conventions, and compliance with the established schema generation
 * rules.
 *
 * The validation can result in either complete success (all rules satisfied) or
 * failure with detailed error information for precise error resolution.
 *
 * @author Samchon
 */
export type IAutoBePrismaValidation =
  | IAutoBePrismaValidation.ISuccess
  | IAutoBePrismaValidation.IFailure;

/**
 * Namespace containing all interfaces for Prisma schema validation results.
 *
 * This namespace defines the structure for validation responses from the schema
 * validation system, providing detailed feedback about schema correctness and
 * specific error locations when validation fails.
 */
export namespace IAutoBePrismaValidation {
  /**
   * Interface representing a successful validation result.
   *
   * This interface is returned when the AutoBePrisma.IApplication structure
   * passes all validation rules including:
   *
   * - No duplicate model names across all files
   * - No duplicate field names within any model
   * - No duplicate relation names within any model
   * - All foreign key references point to existing models
   * - All field types are valid and properly configured
   * - All indexes follow the established rules (no single foreign key indexes)
   * - All naming conventions are properly applied (plural models, snake_case
   *   fields)
   * - All business constraints are satisfied
   */
  export interface ISuccess {
    /**
     * Validation success indicator.
     *
     * Always true for successful validation results. This discriminator
     * property allows TypeScript to properly narrow the union type and provides
     * runtime type checking for validation result processing.
     */
    success: true;

    /**
     * The validated and approved AutoBePrisma application structure.
     *
     * This contains the complete, validation-passed schema definition that can
     * be safely passed to the code generator for Prisma schema file creation.
     * All models, fields, relationships, and indexes in this structure have
     * been verified for correctness and compliance with schema rules.
     *
     * Important: This may not be identical to the original input application.
     * The validation process can apply automatic corrections to resolve
     * validation issues such as removing duplicates or fixing structural
     * problems. These corrections preserve the original business intent while
     * ensuring schema consistency and data integrity.
     */
    data: AutoBePrisma.IApplication;
  }

  /**
   * Interface representing a failed validation result with detailed error
   * information.
   *
   * This interface is returned when the AutoBePrisma.IApplication structure
   * contains one or more validation errors. It provides both the original
   * (potentially flawed) application structure and a comprehensive list of
   * specific errors that need to be resolved.
   *
   * The error information is structured to enable precise error location
   * identification and targeted fixes without affecting unrelated parts of the
   * schema.
   */
  export interface IFailure {
    /**
     * Validation failure indicator.
     *
     * Always false for failed validation results. This discriminator property
     * allows TypeScript to properly narrow the union type and indicates that
     * the errors array contains specific validation issues that must be
     * resolved.
     */
    success: false;

    /**
     * The original AutoBePrisma application structure that failed validation.
     *
     * This contains the complete schema definition as it was submitted for
     * validation, including all the elements that caused validation errors.
     * This structure serves as the baseline for error analysis and correction,
     * allowing error-fixing systems to understand the full context of the
     * schema while addressing specific validation issues.
     */
    data: AutoBePrisma.IApplication;

    /**
     * Array of specific validation errors found in the application structure.
     *
     * Each error provides precise location information (file path, model name,
     * field name) and detailed error descriptions to enable targeted fixes.
     * Errors are ordered by severity and location to facilitate systematic
     * resolution. The array will never be empty when success is false.
     *
     * Common error categories include:
     *
     * - Duplication errors (duplicate models, fields, relations)
     * - Reference errors (invalid foreign key targets, missing models)
     * - Type validation errors (invalid field types, constraint violations)
     * - Index configuration errors (invalid field references, forbidden single FK
     *   indexes)
     * - Naming convention violations (non-plural models, invalid field names)
     */
    errors: IError[];
  }

  /**
   * Interface representing a specific validation error with precise location
   * information.
   *
   * This interface provides detailed information about individual validation
   * errors, including exact location within the schema structure and
   * comprehensive error descriptions. The location information enables
   * error-fixing systems to pinpoint exactly where problems occur without
   * manual search or guesswork.
   *
   * Each error represents a specific violation of schema rules that must be
   * resolved for successful validation.
   */
  export interface IError {
    /**
     * File path where the validation error occurs.
     *
     * Specifies the exact schema file within the
     * AutoBePrisma.IApplication.files array where this error was detected. This
     * corresponds to the filename property of the IFile interface and enables
     * targeted file-level error resolution.
     *
     * Examples: "schema-01-articles.prisma", "schema-03-actors.prisma"
     *
     * This path information allows error-fixing systems to:
     *
     * - Navigate directly to the problematic file
     * - Understand cross-file reference issues
     * - Apply fixes within the correct file context
     * - Maintain proper file organization during error resolution
     */
    path: string;

    /**
     * Name of the model (database table) where the validation error occurs.
     *
     * Specifies the exact model within the identified file that contains the
     * validation error. This corresponds to the name property of the IModel
     * interface and enables targeted model-level error resolution.
     *
     * Examples: "shopping_customers", "bbs_articles",
     * "mv_shopping_sale_last_snapshots"
     *
     * When null, indicates file-level errors such as:
     *
     * - Duplicated file names
     * - Invalid file names
     *
     * This model information allows error-fixing systems to:
     *
     * - Navigate directly to the problematic model definition
     * - Understand model-specific constraint violations
     * - Apply fixes within the correct model context
     * - Resolve cross-model relationship issues
     */
    table: string | null;

    /**
     * Name of the specific field (column) where the validation error occurs.
     *
     * Specifies the exact field within the identified model that contains the
     * validation error, or null for model-level errors that don't relate to a
     * specific field. This corresponds to field names in primaryField,
     * foreignFields, or plainFields arrays of the IModel interface.
     *
     * Examples: "shopping_customer_id", "created_at", "name", null
     *
     * When null, indicates model-level errors such as:
     *
     * - Duplicate model names across files
     * - Missing primary key definitions
     * - Invalid model naming conventions
     * - Model-level constraint violations
     *
     * When string, indicates field-level errors such as:
     *
     * - Duplicate field names within the model
     * - Invalid field types or constraints
     * - Invalid foreign key configurations
     * - Field naming convention violations
     *
     * This field information allows error-fixing systems to:
     *
     * - Navigate directly to the problematic field definition
     * - Distinguish between model-level and field-level issues
     * - Apply targeted fixes without affecting other fields
     * - Resolve field-specific constraint violations
     */
    field: string | null;

    /**
     * Detailed human-readable description of the validation error.
     *
     * Provides comprehensive information about what validation rule was
     * violated, why it's problematic, and often hints at how to resolve the
     * issue. The message is designed to be informative enough for both
     * automated error-fixing systems and human developers to understand and
     * address the problem.
     *
     * Message format typically includes:
     *
     * - Clear description of what rule was violated
     * - Specific details about the problematic element
     * - Context about why this causes validation failure
     * - Sometimes suggestions for resolution approaches
     *
     * This message information allows error-fixing systems to:
     *
     * - Understand the exact nature of the validation failure
     * - Implement appropriate resolution strategies
     * - Provide meaningful feedback to developers
     * - Log detailed error information for debugging
     * - Make informed decisions about fix approaches
     */
    message: string;
  }
}
