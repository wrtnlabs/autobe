import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformPrismaHistories } from "./transformPrismaHistories";

export async function orchestratePrismaSchemas<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  components: { filename: string; tables: string[] }[],
): Promise<IMakePrismaSchemaFilesProps> {
  const start: Date = new Date();
  const entireTables: string[] = Array.from(
    new Set(components.flatMap((c) => c.tables)),
  );

  const files: Record<string, string> = {};

  for (const result of await Promise.all(
    components.map(async (c) => {
      const result: IMakePrismaSchemaFilesProps = await process(ctx, {
        filename: c.filename,
        tables: c.tables,
        entireTables,
      });
      ctx.dispatch({
        type: "prismaSchemas",
        created_at: start.toISOString(),
        files: result.files,
        step: ctx.state().analyze?.step ?? 0,
      });

      return result;
    }),
  )) {
    Object.assign(files, result.files);
  }

  return { files, description: "" };
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  component: { filename: string; tables: string[] } & {
    entireTables: string[];
  },
): Promise<IMakePrismaSchemaFilesProps> {
  const pointer: IPointer<IMakePrismaSchemaFilesProps | null> = {
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
  agentica.on("request", async (event) => {
    if (event.body.tools) {
      event.body.tool_choice = "required";
    }
  });

  await agentica.conversate(
    [
      "Please generate Prisma schema files based on the previous requirement analysis report.",
      "",
      "**Context:**",
      `- Target filename: \`${component.filename}\``,
      `- Tables to implement in this file: \`${component.tables.join("`, `")}\``,
      `- All available tables in the system: \`${component.entireTables.join("`, `")}\``,
      "",
      "**Instructions:**",
      "1. Create comprehensive Prisma schema content for the specified tables",
      "2. Reference the previous requirement analysis to understand business logic and data structures",
      "3. Establish appropriate relationships between tables using the entireTables list as reference",
      "4. Include proper field types, constraints, indexes, and documentation",
      "5. Follow enterprise-level schema design patterns and best practices",
      "6. Ensure cross-table relationships are accurately modeled based on business requirements",
      "",
      "**Key Requirements:**",
      "- Implement only the tables specified for this file",
      "- Create foreign key relationships to tables from entireTables when business logic requires it",
      "- Add comprehensive field documentation and model descriptions",
      "- Include appropriate indexes for performance optimization",
      "- Follow consistent naming conventions and data types",
    ].join("\n"),
  );

  if (pointer.value === null)
    throw new Error("Unreachable code: Prisma Schema not generated");

  return pointer.value;
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IMakePrismaSchemaFilesProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Prisma Generator",
    application,
    execute: {
      makePrismaSchemaFiles: (next) => {
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
   * Generates comprehensive Prisma schema files based on detailed requirements
   * analysis.
   *
   * Creates multiple organized schema files following enterprise patterns
   * including proper domain separation, relationship modeling, snapshot
   * patterns, inheritance, materialized views, and comprehensive documentation.
   * The generated schemas implement best practices for scalability,
   * maintainability, and data integrity.
   *
   * @param props Properties containing the complete set of Prisma schema files
   */
  makePrismaSchemaFiles(props: IMakePrismaSchemaFilesProps): void;
}

interface IMakePrismaSchemaFilesProps {
  /**
   * Collection of Prisma schema files organized by domain/functionality.
   *
   * Key represents the filename (e.g., "main.prisma", "schema-01-core.prisma",
   * "schema-02-users.prisma") and value contains the complete schema content
   * including models, relationships, indexes, and comprehensive documentation.
   *
   * Files should be organized following enterprise patterns:
   *
   * - Main.prisma: Configuration, datasource, and generators
   * - Schema-XX-domain.prisma: Domain-specific entity definitions
   * - Proper cross-file relationships and dependencies
   */
  files: Record<string, string>;

  /** Summary description of the application requirements and business context. */
  description: string;
}
