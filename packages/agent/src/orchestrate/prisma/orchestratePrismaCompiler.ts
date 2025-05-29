import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { IAutoBePrismaCompilerResult } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { StringUtil } from "../../utils/StringUtil";
import { transformPrismaCompilerHistories } from "./transformPrismaCompilerHistories";

export function orchestratePrismaCompiler<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  files: Record<string, string>,
  retry: number = 8,
): Promise<IAutoBePrismaCompilerResult> {
  return step(ctx, files, retry);
}

async function step<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  files: Record<string, string>,
  life: number,
): Promise<IAutoBePrismaCompilerResult> {
  // FIX MAIN PRISMA FILE
  files["main.prisma"] = MAIN_PRISMA_FILE;

  // TRY COMPILATION
  const result: IAutoBePrismaCompilerResult = await ctx.compiler.prisma({
    files,
  });
  if (result.type !== "failure" || life <= 0) return result;

  // VALIDATION FAILED
  ctx.dispatch({
    type: "prismaValidate",
    schemas: files,
    result,
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
    histories: transformPrismaCompilerHistories(files, result),
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
    StringUtil.trim`
      Resolve the compilation errors in the provided Prisma schema files.

      Don't remake every schema files. Fix only some of the files that have
      compilation errors. You MUST provide complete, corrected files.
    `,
  );
  if (pointer.value === null) {
    console.error(
      "Unreachable error: PrismaCompilerAgent.pointer.value is null",
    );
    return result; // unreachable
  }

  ctx.dispatch({
    type: "prismaCorrect",
    input: files,
    failure: result,
    correction: pointer.value.files,
    planning: pointer.value.planning,
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  });

  const newFiles: Record<string, string> = {
    ...files,
    ...pointer.value.files,
  };
  return step(ctx, newFiles, life - 1);
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
      modifyPrismaSchemaFiles: (next) => {
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
   * Fixes Prisma compilation errors while preserving ALL existing comments,
   * documentation, and schema structure.
   *
   * ## Core Rules
   *
   * 1. Fix ONLY compilation errors - never remove comments/documentation
   * 2. Apply minimal changes - preserve original design and relationships
   * 3. Return COMPLETE files - no truncation allowed
   * 4. NEVER use mapping names in @relation directives
   *
   * ## Preservation Requirements
   *
   * - Keep ALL comments (`//` and `///`)
   * - Keep ALL field/model documentation
   * - Keep business logic and architectural patterns
   * - Remove description comments only when erasing properties/relationships
   *
   * ## Fix Strategy
   *
   * - Resolve syntax/relationship errors without changing structure
   * - Remove mapping names from @relation directives if present
   * - Add missing foreign keys/constraints while preserving documentation
   */
  modifyPrismaSchemaFiles(props: IModifyPrismaSchemaFilesProps): void;
}

interface IModifyPrismaSchemaFilesProps {
  /**
   * Detailed execution plan for fixing Prisma compilation errors.
   *
   * 🎯 Purpose: Enable systematic reasoning and step-by-step error resolution
   * approach
   *
   * 📋 Required Planning Content:
   *
   * 1. **Error Analysis Summary**
   *
   *    - List all identified compilation errors with their locations
   *    - Categorize errors by type (syntax, relationships, types, constraints)
   *    - Identify root causes and error interdependencies
   * 2. **Fix Strategy Overview**
   *
   *    - Prioritize fixes based on dependencies (fix foundational errors first)
   *    - Outline minimal changes needed for each error
   *    - Identify potential impact on other schema parts
   * 3. **Step-by-Step Fix Plan**
   *
   *    - File-by-file modification plan with specific changes
   *    - Exact line numbers or sections to be modified
   *    - New code additions or corrections to be applied
   *    - Verification steps to ensure fixes don't break other parts
   * 4. **Preservation Checklist**
   *
   *    - Confirm which comments/documentation must be preserved
   *    - List relationships and business logic to maintain unchanged
   *    - Identify cross-file dependencies that must remain intact
   * 5. **Risk Assessment**
   *
   *    - Potential side effects of each planned fix
   *    - Validation points to check after applying fixes
   *    - Rollback considerations if fixes introduce new issues
   *
   * 💡 Example Planning Structure:
   *
   *     ## Error Analysis
   *     - Error 1: Missing foreign key field 'userId' in Post model (schema-02-posts.prisma:15)
   *     - Error 2: Invalid @relation reference to non-existent 'User.posts' (schema-01-users.prisma:8)
   *
   *     ## Fix Strategy
   *     1. Add missing 'userId String' field to Post model
   *     2. Update @relation mapping in User model to reference correct field
   *
   *     ## Detailed Steps
   *     1. schema-02-posts.prisma: Add 'userId String' after line 14
   *     2. schema-01-users.prisma: Fix @relation(fields: [userId], references: [id])
   *
   *     ## Preservation Notes
   *     - Keep all existing comments in Post model
   *     - Maintain User model documentation
   *     - Preserve existing indexes and constraints
   */
  planning: string;

  /**
   * Original Prisma schema files that contain compilation errors and need
   * correction.
   *
   * 📥 Input Structure:
   *
   * - Key: filename (e.g., "schema-01-users.prisma")
   * - Value: COMPLETE original file content with compilation errors
   *
   * 🔍 Expected Input File Types:
   *
   * - Domain-specific schema files: "schema-XX-domain.prisma" → Contains complete
   *   model definitions for specific business domains
   *
   * 📝 Input File Content Analysis:
   *
   * - All models with their complete field definitions
   * - All relationships (@relation directives with field mappings)
   * - All indexes, constraints, and unique identifiers
   * - All enums and their complete value sets
   * - All comments and documentation
   * - Cross-file model references and dependencies
   *
   * ⚠️ Input Processing Notes:
   *
   * - Files may contain syntax errors, type mismatches, or missing references
   * - Some models might reference non-existent fields or models
   * - Relationship mappings might be incorrect or incomplete
   * - Foreign key fields might be missing or incorrectly defined
   * - Cross-file dependencies might be broken or circular
   */
  files: Record<string, string>;
}

const MAIN_PRISMA_FILE = StringUtil.trim`
  generator client {
    provider        = "prisma-client-js"
    previewFeatures = ["postgresqlExtensions", "views"]
    binaryTargets   = ["native"]
  }

  datasource db {
    provider   = "postgresql"
    url        = env("DATABASE_URL")
    extensions = []
  }

  generator markdown {
    provider = "prisma-markdown"
    output   = "../docs/ERD.md"
  }
`;
