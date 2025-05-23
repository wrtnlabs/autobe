import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { IAutoBePrismaCompilerResult } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformPrismaCompilerHistories } from "./transformPrismaCompilerHistories";

export async function orchestratePrismaCompiler<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  files: Record<string, string>,
  retry: number = 10,
): Promise<IAutoBePrismaCompilerResult & { description: string }> {
  const pointer: IPointer<IModifyPrismaSchemaFilesProps> = {
    value: { files, description: "" },
  };
  const agentica: MicroAgentica<Model> = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...(ctx.config ?? {}),
    },
    histories: transformPrismaCompilerHistories(ctx.state(), files),
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

  let result: IAutoBePrismaCompilerResult;

  for (let i: number = 0; i < retry; ++i) {
    result = await ctx.compiler.prisma({
      files: pointer.value?.files ?? files,
    });

    if (result.type !== "failure") break;
    ctx.dispatch({
      type: "prismaValidate",
      schemas: files,
      result,
      step: ctx.state().analyze?.step ?? 0,
      created_at: new Date().toISOString(),
    });

    await agentica.conversate(
      [
        "The Prisma schema files have compilation errors that must be fixed. You MUST provide complete, corrected files.",
        "",
        "============================================== CURRENT FILES ==============================================",
        "",
        ...Object.entries(pointer.value?.files ?? files).flatMap(
          ([filename, content]) => [`### ${filename} ###`, content, ""],
        ),
        "",
        "============================================== COMPILATION ERRORS ==============================================",
        "",
        result.reason,
        "",
        "============================================== REQUIREMENTS ==============================================",
        "",
        "CRITICAL: You must call the modifyPrismaSchemaFiles function with:",
        "",
        "1. **COMPLETE file contents** - Do NOT truncate or abbreviate any content",
        "2. **ALL files** - Every file from the input must be included in the output",
        "3. **Fixed errors** - Resolve all compilation errors shown above",
        "4. **Preserved structure** - Keep all models, fields, relationships, and comments",
        "5. **Proper syntax** - Ensure valid Prisma schema syntax",
        "",
        "IMPORTANT NOTES:",
        "- Include the ENTIRE content of each file, not summaries or truncated versions",
        "- Maintain all existing relationships between models",
        "- Keep all field definitions, attributes, and indexes",
        "- Preserve all comments and documentation",
        "- Fix ONLY the compilation errors, don't make unnecessary changes",
        "",
        "Example of what NOT to do:",
        "```",
        "// ... (truncated for brevity)",
        "// ... other fields and relationships",
        "// ... unchanged ...",
        "```",
        "",
        "You must provide the COMPLETE file content for each file.",
      ].join("\n"),
    );

    if (i === retry - 1) {
      throw new Error("Prisma schema compiler failed");
    }
  }

  return { ...result!, description: pointer.value.description };
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
   * Fixes compilation errors in Prisma schema files.
   *
   * CRITICAL: This function must return COMPLETE file contents, not truncated
   * versions.
   *
   * Responsibilities:
   *
   * 1. Analyze compilation errors in the provided schema files
   * 2. Fix all syntax and structural issues
   * 3. Return COMPLETE corrected files (no truncation or abbreviation)
   * 4. Preserve all existing models, relationships, and business logic
   * 5. Maintain proper cross-file references and dependencies
   *
   * @param props Contains files to fix and requires complete file contents in
   *   response
   */
  modifyPrismaSchemaFiles(props: IModifyPrismaSchemaFilesProps): void;
}

interface IModifyPrismaSchemaFilesProps {
  /**
   * COMPLETE Prisma schema files with ALL content included.
   *
   * CRITICAL REQUIREMENTS:
   *
   * - Each file must contain the ENTIRE schema content
   * - Do NOT truncate, abbreviate, or use placeholders like "... unchanged ..."
   * - Include ALL models, fields, relationships, indexes, and comments
   * - Maintain exact same file organization and naming
   *
   * File organization patterns:
   *
   * - Main.prisma: Configuration, datasource, generators
   * - Schema-XX-domain.prisma: Complete domain-specific models with ALL fields
   *
   * Key = filename (e.g., "main.prisma", "schema-01-core.prisma") Value =
   * COMPLETE file content (no truncation allowed)
   */
  files: Record<string, string>;

  /**
   * Brief description of what was fixed or modified in the schema files. Should
   * summarize the changes made to resolve compilation errors.
   */
  description: string;
}
