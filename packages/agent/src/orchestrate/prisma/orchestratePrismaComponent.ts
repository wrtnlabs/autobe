import {
  AgenticaAssistantMessageHistory,
  IAgenticaController,
  MicroAgentica,
  MicroAgenticaHistory,
} from "@agentica/core";
import { AutoBeAssistantMessageHistory, AutoBePrisma } from "@autobe/interface";
import { AutoBePrismaComponentsEvent } from "@autobe/interface/src/events/AutoBePrismaComponentsEvent";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
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
  const prefix: string | null = ctx.state().analyze?.prefix ?? null;

  const agentica: MicroAgentica<Model> = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...(ctx.config ?? {}),
      executor: {
        describe: null,
      },
    },
    histories: transformPrismaComponentsHistories(ctx.state(), prefix),
    controllers: [
      createApplication({
        model: ctx.model,
        build: (next) => {
          pointer.value ??= {
            components: [],
          };
          pointer.value.components.push(...next.components);
        },
      }),
    ],
  });

  const histories: MicroAgenticaHistory<Model>[] = await agentica
    .conversate(content)
    .finally(() => {
      const tokenUsage = agentica.getTokenUsage();
      ctx.usage().record(tokenUsage, ["prisma"]);
    });
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
};

interface IApplication {
  /**
   * Organizes database tables into domain-based components for Prisma schema
   * generation.
   *
   * Takes business requirements and groups related tables into logical domains,
   * with each component becoming a separate .prisma file.
   *
   * **Example:**
   *
   * ```typescript
   * application.extractComponents({
   *   components: [
   *     {
   *       filename: "schema-02-systematic.prisma",
   *       namespace: "Systematic",
   *       tables: ["shopping_channels", "shopping_sections"],
   *     },
   *     {
   *       filename: "schema-03-actors.prisma",
   *       namespace: "Actors",
   *       tables: [
   *         "shopping_customers",
   *         "shopping_citizens",
   *         "shopping_administrators",
   *       ],
   *     },
   *     {
   *       filename: "schema-04-sales.prisma",
   *       namespace: "Sales",
   *       tables: [
   *         "shopping_sales",
   *         "shopping_sale_snapshots",
   *         "shopping_sale_units",
   *       ],
   *     },
   *   ],
   * });
   * ```
   */
  extractComponents(props: IExtractComponentsProps): void;
}

interface IExtractComponentsProps {
  /**
   * Array of domain components that group related database tables.
   *
   * Each component represents a business domain and becomes one Prisma schema
   * file. Common domains include: Actors (users), Sales (products), Orders,
   * Carts, etc.
   *
   * **Example:**
   *
   * ```typescript
   * {
   *   "components": [
   *     {
   *       "filename": "schema-02-systematic.prisma",
   *       "namespace": "Systematic",
   *       "tables": [
   *         "shopping_channels",
   *         "shopping_sections",
   *         "shopping_channel_categories"
   *       ]
   *     },
   *     {
   *       "filename": "schema-03-actors.prisma",
   *       "namespace": "Actors",
   *       "tables": [
   *         "shopping_customers",
   *         "shopping_citizens",
   *         "shopping_administrators"
   *       ]
   *     },
   *     {
   *       "filename": "schema-04-sales.prisma",
   *       "namespace": "Sales",
   *       "tables": [
   *         "shopping_sales",
   *         "shopping_sale_snapshots",
   *         "shopping_sale_units",
   *         "shopping_sale_unit_options"
   *       ]
   *     }
   *   ]
   * }
   * ```
   *
   * **Notes:**
   *
   * - Table names must follow snake_case convention with domain prefix (e.g.,
   *   `shopping_customers`)
   * - Each component becomes one `.prisma` file containing related models
   * - Filename numbering indicates dependency order for schema generation
   * - Namespace is used for documentation organization and domain grouping
   */
  components: AutoBePrisma.IComponent[];
}
