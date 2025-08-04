import { AutoBePrisma } from "@autobe/interface";

export interface IAutoBePrismaCorrectApplication {
  /**
   * Fixes validation errors in specific AutoBePrisma models while preserving
   * ALL existing business logic and model descriptions.
   *
   * ## Core Rules
   *
   * 1. Fix ONLY validation errors in provided models - never remove business
   *    descriptions
   * 2. Apply minimal changes to error models only - preserve original design
   *    intent
   * 3. Return ONLY corrected models - unchanged models remain in original schema
   * 4. Maintain referential integrity with unchanged models
   *
   * ## Targeted Scope
   *
   * - Process ONLY models with validation errors from IError[] array
   * - Exclude models without errors from processing and output
   * - Minimize context usage by returning corrected models only
   * - Preserve unchanged models in their original state
   *
   * ## Fix Strategy
   *
   * - Resolve validation errors within specific models only
   * - Fix field duplications, invalid references, and type mismatches
   * - Update cross-model references without modifying target models
   * - Ensure naming conventions and index rules compliance in corrected models
   */
  correctPrismaSchemaFiles(props: IAutoBePrismaCorrectApplication.IProps): void;
}
export namespace IAutoBePrismaCorrectApplication {
  export interface IProps {
    /**
     * Detailed execution plan for fixing `AutoBePrisma` validation errors in
     * specific models.
     *
     * 🎯 Purpose: Enable systematic reasoning and step-by-step error resolution
     * approach for targeted model validation issues
     *
     * 📋 Required Planning Content:
     *
     * 1. **Error Scope Analysis**
     *
     *    - List all validation errors from IAutoBePrismaValidation.IError[] array
     *    - Extract unique table names from errors to identify affected models
     *    - Categorize errors by type (field duplications, references, types,
     *         indexes)
     *    - Identify which models need correction vs. which remain unchanged
     * 2. **Targeted Fix Strategy**
     *
     *    - Focus ONLY on models mentioned in validation errors
     *    - Outline minimal changes needed for each affected model
     *    - Plan cross-model reference updates (if any) without modifying non-error
     *         models
     *    - Ensure unchanged models maintain valid references to corrected models
     * 3. **Model-Specific Fix Plan**
     *
     *    - Model-by-model modification plan for ONLY affected models
     *    - Exact field additions, renames, or type corrections required
     *    - Reference updates within corrected models only
     *    - Index corrections limited to affected models
     * 4. **Minimal Scope Validation**
     *
     *    - Confirm which models will be included in output (error models only)
     *    - List models that will remain unchanged in original schema
     *    - Identify cross-model dependencies without including unchanged models
     *    - Preserve all business logic within corrected models
     * 5. **Targeted Impact Assessment**
     *
     *    - Potential effects of fixes on unchanged models (reference validation)
     *    - Verification points for corrected models only
     *    - Ensure no new validation errors in targeted models
     *    - Confirm minimal output scope compliance
     *
     * 💡 Example Planning Structure:
     *
     *     ## Error Scope
     *     - Target Models: shopping_customers, shopping_orders (2 models only)
     *     - Unchanged Models: All others remain in original schema
     *
     *     ## Targeted Fixes
     *     - shopping_customers: Remove duplicate 'email' field
     *     - shopping_orders: Update targetModel reference to 'shopping_customers'
     *
     *     ## Output Scope
     *     - Return: Only shopping_customers and shopping_orders models
     *     - Preserve: All other models unchanged in original schema
     *
     *     ## Cross-Model Impact
     *     - Verify: shopping_orders still references shopping_customers correctly
     *     - No changes needed in other models referencing these
     */
    planning: string;

    /**
     * ONLY the specific models that contain validation errors and need
     * correction.
     *
     * 📥 Input Structure:
     *
     * - Contains ONLY models mentioned in IAutoBePrismaValidation.IError[] array
     * - Each model has specific validation errors that need targeted correction
     * - Models not mentioned in errors are excluded from this input
     * - Represents minimal scope for error correction
     *
     * 🔍 Expected Validation Issues (Model-Specific):
     *
     * - Duplicate field/relation names within these specific models
     * - Invalid foreign key references from these models to other models
     * - Single foreign key fields in index arrays within these models
     * - Invalid naming conventions within these specific models
     * - Type validation errors in fields of these models
     *
     * 📝 Model Content Analysis (Targeted Scope):
     *
     * - Complete field definitions for each error model only
     * - Relationships from these models (may reference unchanged models)
     * - Indexes within these models that need correction
     * - Business descriptions specific to these models
     * - Cross-model references that need validation (read-only for targets)
     *
     * ⚠️ Processing Notes (Focused Approach):
     *
     * - Input contains ONLY models with validation errors
     * - May reference other models not included in this input
     * - Cross-model references must be validated but target models won't be
     *   modified
     * - Output should return corrected versions of ONLY these input models
     * - All business logic and descriptions within these models must be preserved
     * - Corrections must not break references from unchanged models
     *
     * 🎯 Correction Scope:
     *
     * - Fix validation errors within these specific models
     * - Update internal model structure (fields, relations, indexes)
     * - Correct references to external models (without modifying targets)
     * - Maintain compatibility with unchanged models in the full schema
     * - Return corrected versions of ONLY these models
     */
    models: AutoBePrisma.IModel[];
  }
}
