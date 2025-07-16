import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBePrisma } from "@autobe/interface";
import { AutoBePrismaSchemasEvent } from "@autobe/interface/src/events/AutoBePrismaSchemasEvent";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { forceRetry } from "../../utils/forceRetry";
import { transformPrismaSchemaHistories } from "./transformPrismaSchemaHistories";

export async function orchestratePrismaSchemas<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  components: { filename: string; tables: string[] }[],
): Promise<AutoBePrismaSchemasEvent[]> {
  const start: Date = new Date();
  const entireTables: string[] = Array.from(
    new Set(components.flatMap((c) => c.tables)),
  );

  const total: number = components.reduce((acc, c) => acc + c.tables.length, 0);
  let i: number = 0;
  return await Promise.all(
    components.map(async (c) => {
      const result: IMakePrismaSchemaFileProps = await forceRetry(() =>
        process(ctx, {
          filename: c.filename,
          tables: c.tables,
          entireTables,
        }),
      );
      const event: AutoBePrismaSchemasEvent = {
        type: "prismaSchemas",
        created_at: start.toISOString(),
        file: result.file,
        completed: (i += c.tables.length),
        total,
        step: ctx.state().analyze?.step ?? 0,
      };
      ctx.dispatch(event);
      return event;
    }),
  );
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  component: {
    filename: string;
    tables: string[];
    entireTables: string[];
  },
  remained?: {
    done: AutoBePrisma.IModel[];
    todo: string[];
    namespace: string;
  },
): Promise<IMakePrismaSchemaFileProps> {
  const pointer: IPointer<IMakePrismaSchemaFileProps | null> = {
    value: null,
  };
  const agentica: MicroAgentica<Model> = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...(ctx.config ?? {}),
      executor: {
        describe: null,
      },
    },
    histories: transformPrismaSchemaHistories(
      ctx.state().analyze!,
      component,
      remained,
    ),
    controllers: [
      createApplication({
        model: ctx.model,
        build: (next) => {
          pointer.value ??= {
            file: {
              filename: component.filename,
              namespace: next.file.namespace,
              models: [],
            },
          };
          pointer.value.file.models.push(...next.file.models);
        },
      }),
    ],
  });
  enforceToolCall(agentica);

  await agentica.conversate("Make prisma schema file please").finally(() => {
    const tokenUsage = agentica.getTokenUsage();
    ctx.usage().record(tokenUsage, ["prisma"]);
  });
  if (pointer.value === null)
    throw new Error("Unreachable code: Prisma Schema not generated");

  const file: AutoBePrisma.IFile = pointer.value.file;
  const todo: string[] = (remained?.todo ?? component.tables).filter((x) =>
    file.models.every((m) => m.name !== x),
  );
  if (todo.length !== 0) {
    const fulfill: IMakePrismaSchemaFileProps = await process(
      ctx,
      {
        filename: component.filename,
        tables: component.tables,
        entireTables: component.entireTables,
      },
      {
        done: [...(remained?.done ?? []), ...file.models],
        todo,
        namespace: file.namespace,
      },
    );
    pointer.value.file.models.push(...fulfill.file.models);
  }
  return pointer.value;
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IMakePrismaSchemaFileProps) => void;
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
      makePrismaSchemaFile: (next) => {
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
   * Generates comprehensive Prisma schema files based on detailed requirements
   * analysis.
   *
   * Creates multiple organized schema files following enterprise patterns
   * including proper domain separation, relationship modeling, snapshot
   * patterns, inheritance, materialized views, and comprehensive documentation.
   * The generated schemas implement best practices for scalability,
   * maintainability, and data integrity.
   *
   * @param props Properties containing the file
   */
  makePrismaSchemaFile(props: IMakePrismaSchemaFileProps): void;
}

interface IMakePrismaSchemaFileProps {
  /**
   * Complete definition of a single Prisma schema file.
   *
   * Represents one business domain containing related models, organized for
   * modular schema management and following domain-driven design principles.
   */
  file: AutoBePrisma.IFile;
}
