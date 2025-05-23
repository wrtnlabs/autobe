import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { IAutoBePrismaCompilerResult } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformPrismaHistories } from "./transformPrismaHistories";

export async function orchestratePrismaCompiler<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  files: Record<string, string>,
  retry: number = 5,
): Promise<IAutoBePrismaCompilerResult & { description: string }> {
  const pointer: IPointer<IModifyPrismaSchemaFilesProps | null> = {
    value: null,
  };
  const agentica: MicroAgentica<Model> = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...(ctx.config ?? {}),
    },
    histories: transformPrismaHistories(ctx.state()),
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
    result = await ctx.compiler.prisma({ files });

    if (result.type !== "failure") break;
    ctx.dispatch({
      type: "prismaValidate",
      schemas: files,
      result,
      step: ctx.state().prisma?.step ?? 0,
      created_at: new Date().toISOString(),
    });

    await agentica.conversate(
      [
        "Previous generated prisma schema files are invalid.",
        "",
        "Please re-generate the prisma schema files, referencing the below compilation error message.",
        "",
        "--------------------------------------------",
        "",
        result.reason,
      ].join("\n"),
    );
  }

  if (pointer.value === null)
    throw new Error(
      "Unreachable code: Prisma Schema Compiler not generate Prisma Schema",
    );

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
   * Modifies and refines Prisma schema files based on compilation feedback.
   *
   * Takes existing schema files (potentially with errors) and improves them by
   * fixing compilation issues, optimizing relationships, and ensuring proper
   * enterprise patterns. Handles iterative refinement through error-driven
   * development.
   *
   * @param props Properties containing the schema files to be modified
   */
  modifyPrismaSchemaFiles(props: IModifyPrismaSchemaFilesProps): void;
}

interface IModifyPrismaSchemaFilesProps {
  /**
   * Target collection of Prisma schema files organized by domain/functionality.
   *
   * Key represents the filename (e.g., "main.prisma", "schema-01-core.prisma",
   * "schema-02-users.prisma") and value contains the complete schema content
   * including models, relationships, indexes, and comprehensive documentation.
   *
   * Generated files will be organized following enterprise patterns:
   *
   * - Main.prisma: Configuration, datasource, and generators
   * - Schema-XX-domain.prisma: Domain-specific entity definitions
   * - Proper cross-file relationships and dependencies
   */
  files: Record<string, string>;

  /** Summary description of the application requirements and business context. */
  description: string;
}
