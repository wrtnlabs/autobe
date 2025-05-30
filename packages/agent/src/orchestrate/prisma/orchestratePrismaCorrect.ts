import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBePrisma, IAutoBePrismaValidation } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformPrismaCorrectHistories } from "./transformPrismaCorrectHistories";

export function orchestratePrismaCorrect<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  application: AutoBePrisma.IApplication,
  retry: number = 8,
): Promise<IAutoBePrismaValidation> {
  return step(ctx, application, retry);
}

async function step<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  application: AutoBePrisma.IApplication,
  life: number,
): Promise<IAutoBePrismaValidation> {
  const result: IAutoBePrismaValidation =
    await ctx.compiler.prisma.validate(application);
  if (result.success) return result; // SUCCESS

  // VALIDATION FAILED
  const schemas: Record<string, string> =
    await ctx.compiler.prisma.write(application);
  ctx.dispatch({
    type: "prismaValidate",
    result,
    schemas,
    compiled: await ctx.compiler.prisma.compile({
      files: schemas,
    }),
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  });

  const pointer: IPointer<IModifyPrismaSchemaFilesProps | null> = {
    value: null,
  };
  const agentica: MicroAgentica<Model> = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...(ctx.config ?? {}),
    },
    histories: transformPrismaCorrectHistories(result),
    tokenUsage: ctx.usage(),
    controllers: [
      createApplication({
        model: ctx.model,
        build: (next) => {
          pointer.value = next;
        },
      }),
    ],
  });
  agentica.on("request", (event) => {
    if (event.body.tools) {
      event.body.tool_choice = "required";
    }
  });

  // REQUEST CORRECTION
  await agentica.conversate(
    "Resolve the compilation errors in the provided Prisma schema files.",
  );
  if (pointer.value === null) {
    console.error(
      "Unreachable error: PrismaCompilerAgent.pointer.value is null",
    );
    return result; // unreachable
  }

  ctx.dispatch({
    type: "prismaCorrect",
    failure: result,
    correction: {
      files: pointer.value.files,
    },
    planning: pointer.value.planning,
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  });
  return step(
    ctx,
    {
      files: pointer.value.files,
    },
    life - 1,
  );
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IModifyPrismaSchemaFilesProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Prisma Compiler",
    application,
    execute: {
      correctPrismaSchemaFiles: (next) => {
        props.build(next);
      },
    } satisfies IApplication,
  };
}

const claude = typia.llm.application<
  IApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
  "3.0": typia.llm.application<IApplication, "3.0">(),
};

interface IApplication {
  /**
   * Fixes validation errors in AutoBePrisma.IApplication structure while
   * preserving ALL existing business logic and model descriptions.
   *
   * ## Core Rules
   *
   * 1. Fix ONLY validation errors - never remove business descriptions
   * 2. Apply minimal changes - preserve original design intent
   * 3. Return COMPLETE corrected structure - no data loss allowed
   * 4. Maintain referential integrity across all models
   *
   * ## Preservation Requirements
   *
   * - Keep ALL model and field descriptions
   * - Keep business logic and architectural patterns
   * - Maintain relationship semantics and cardinality
   * - Remove descriptions only when removing duplicate elements
   *
   * ## Fix Strategy
   *
   * - Resolve structural validation errors without changing business intent
   * - Remove duplicate fields/relations while preserving most appropriate ones
   * - Fix invalid references and type mismatches
   * - Ensure naming conventions and index rules compliance
   */
  correctPrismaSchemaFiles(props: IModifyPrismaSchemaFilesProps): void;
}

interface IModifyPrismaSchemaFilesProps {
  /**
   * Detailed execution plan for fixing AutoBePrisma validation errors.
   *
   * 🎯 Purpose: Enable systematic reasoning and step-by-step error resolution
   * approach for structured schema validation issues
   *
   * 📋 Required Planning Content:
   *
   * 1. **Error Analysis Summary**
   *
   *    - List all validation errors from IAutoBePrismaValidation.IError[] array
   *    - Categorize errors by type (duplications, references, types, indexes)
   *    - Identify root causes and error interdependencies
   * 2. **Fix Strategy Overview**
   *
   *    - Prioritize fixes based on dependencies (fix duplications first)
   *    - Outline minimal changes needed for each validation error
   *    - Identify potential impact on other models/relationships
   * 3. **Step-by-Step Fix Plan**
   *
   *    - Model-by-model modification plan with specific changes
   *    - Exact field additions, removals, or renames required
   *    - Reference updates needed for renamed elements
   *    - Index corrections to comply with validation rules
   * 4. **Preservation Checklist**
   *
   *    - Confirm which descriptions and business logic must be preserved
   *    - List relationships and constraints to maintain unchanged
   *    - Identify cross-model dependencies that must remain intact
   * 5. **Risk Assessment**
   *
   *    - Potential side effects of each planned fix
   *    - Validation points to check after applying corrections
   *    - Ensure no new validation errors are introduced
   *
   * 💡 Example Planning Structure:
   *
   *     ## Error Analysis
   *     - Error 1: Duplicate field 'name' in shopping_customers model
   *     - Error 2: Invalid targetModel 'shopping_customer' should be 'shopping_customers'
   *
   *     ## Fix Strategy
   *     1. Remove duplicate 'name' field (keep the more detailed one)
   *     2. Update foreign key references to use correct plural model name
   *
   *     ## Detailed Steps
   *     1. shopping_customers model: Remove second 'name' field from plainFields
   *     2. shopping_orders model: Update targetModel from 'shopping_customer' to 'shopping_customers'
   *
   *     ## Preservation Notes
   *     - Keep business descriptions for remaining 'name' field
   *     - Maintain all relationship semantics
   *     - Preserve all indexes and constraints
   */
  planning: string;

  /**
   * Original AutoBePrisma.IApplication structure that contains validation
   * errors and needs correction.
   *
   * 📥 Input Structure:
   *
   * - Complete IApplication with files array containing validation errors
   * - Each file contains models with potential structural issues
   * - Errors may include duplications, invalid references, or constraint
   *   violations
   *
   * 🔍 Expected Validation Issues:
   *
   * - Duplicate model names across files
   * - Duplicate field/relation names within models
   * - Invalid foreign key references to non-existent models
   * - Single foreign key fields in index arrays
   * - Non-plural model names or invalid naming conventions
   *
   * 📝 Application Content Analysis:
   *
   * - All models with their complete field definitions
   * - All relationships with targetModel and targetfield configurations
   * - All indexes (unique, plain, GIN) with field references
   * - All business descriptions and requirement mappings
   * - Cross-file model references and dependencies
   *
   * ⚠️ Processing Notes:
   *
   * - Structure may contain validation errors that prevent code generation
   * - Some models might reference non-existent targets
   * - Field names might violate naming conventions
   * - Index configurations might include forbidden single foreign keys
   * - Business logic and descriptions must be preserved during fixes
   */
  files: AutoBePrisma.IFile[];
}
