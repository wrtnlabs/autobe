import {
  AgenticaAssistantMessageHistory,
  IAgenticaController,
  MicroAgentica,
  MicroAgenticaHistory,
} from "@agentica/core";
import { AutoBeAssistantMessageHistory } from "@autobe/interface";
import { AutoBePrismaComponentsEvent } from "@autobe/interface/src/events/AutoBePrismaComponentsEvent";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia, { tags } from "typia";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformPrismaComponentsHistories } from "./transformPrismaComponentsHistories";

export async function orchestratePrismaComponents<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  content: string = "Please extract files and tables from the given documents.",
): Promise<AutoBeAssistantMessageHistory | AutoBePrismaComponentsEvent> {
  const start: Date = new Date();
  const pointer: IPointer<IExtractComponentsProps | null> = {
    value: null,
  };
  const agentica: MicroAgentica<Model> = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...(ctx.config ?? {}),
    },
    histories: transformPrismaComponentsHistories(ctx.state()),
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

  const histories: MicroAgenticaHistory<Model>[] =
    await agentica.conversate(content);
  if (histories.at(-1)?.type === "assistantMessage")
    return {
      ...(histories.at(-1)! as AgenticaAssistantMessageHistory),
      created_at: start.toISOString(),
      completed_at: new Date().toISOString(),
      id: v4(),
    } satisfies AutoBeAssistantMessageHistory;
  else if (pointer.value === null) {
    throw new Error("Failed to extract files and tables."); // unreachable
  }
  return {
    type: "prismaComponents",
    created_at: start.toISOString(),
    components: pointer.value.components,
    step: ctx.state().analyze?.step ?? 0,
  };
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IExtractComponentsProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Prisma Extract Files and Tables",
    application,
    execute: {
      extractComponents: (next) => {
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
   * Extracts and organizes database schema files with their corresponding table
   * definitions.
   *
   * Processes Prisma schema files and maps each file to its contained database
   * tables, enabling structured organization of schemas across multiple files
   * for large projects.
   *
   * @example
   *   ```typescript
   *   application.extractFilesAndTables({
   *     components: [
   *       {
   *         filename: "schema-01-users.prisma",
   *         tables: ["user", "user_profile"]
   *       },
   *       {
   *         filename: "schema-02-articles.prisma",
   *         tables: ["article", "attachment_file"]
   *       }
   *     ]
   *   });
   *   ```;
   *
   * @param props - Configuration object containing the file-to-table mapping
   *   structure
   */
  extractComponents(props: IExtractComponentsProps): void;
}

interface IExtractComponentsProps {
  /**
   * Maps Prisma schema filenames to their contained database tables.
   *
   * **Structure:**
   *
   * - Key: Prisma schema filename with .prisma extension
   * - Value: Array of table names defined in that file
   *
   * **Example:**
   *
   * ```typescript
   * {
   *   {
   *     filename: "schema-01-users.prisma",
   *     tables: ["user", "user_profile", "user_settings"]
   *   },
   *   {
   *     filename: "schema-02-articles.prisma",
   *     tables: ["article", "article_snapshot"]
   *   },
   *   {
   *     filename: "schema-03-comments.prisma",
   *     tables: ["comment", "comment_like"]
   *   }
   * }
   * ```
   *
   * **Notes:**
   *
   * - Table names must match exact Prisma model names (case-sensitive)
   * - Keep mapping synchronized with actual schema files
   * - Use consistent naming convention for files
   */
  components: IComponent[];
}

interface IComponent {
  /** Filename of the Prisma schema file. */
  filename: string & tags.Pattern<"^[a-zA-Z0-9._-]+\\.prisma$">;

  /** List of table names that would be stored in the file. */
  tables: Array<string & tags.Pattern<"^[a-z][a-z0-9_]*$">>;
}
