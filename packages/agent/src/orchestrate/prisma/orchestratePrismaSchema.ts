import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBePrisma } from "@autobe/interface";
import { AutoBePrismaSchemasEvent } from "@autobe/interface/src/events/AutoBePrismaSchemasEvent";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { forceRetry } from "../../utils/forceRetry";
import { transformPrismaSchemaHistories } from "./transformPrismaSchemaHistories";

export async function orchestratePrismaSchemas<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  components: AutoBePrisma.IComponent[],
): Promise<AutoBePrismaSchemasEvent[]> {
  const start: Date = new Date();
  const total: number = components.reduce((acc, c) => acc + c.tables.length, 0);
  let i: number = 0;
  return await Promise.all(
    components.map(async (c, x) => {
      const result: IMakePrismaSchemaFileProps = await forceRetry(() =>
        process(
          ctx,
          c,
          components.filter((_, y) => x !== y),
        ),
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
  component: AutoBePrisma.IComponent,
  otherComponents: AutoBePrisma.IComponent[],
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
      otherComponents,
    ),
    controllers: [
      createApplication(ctx, {
        expected: component.tables,
        build: (next) => {
          pointer.value ??= {
            file: {
              filename: component.filename,
              namespace: component.namespace,
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
  return pointer.value;
}

function createApplication<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    expected: string[];
    build: (next: IMakePrismaSchemaFileProps) => void;
  },
): IAgenticaController.IClass<Model> {
  assertSchemaModel(ctx.model);
  const application: ILlmApplication<Model> = collection[
    ctx.model
  ] as unknown as ILlmApplication<Model>;
  application.functions[0].validate = (
    input: unknown,
  ): IValidation<IMakePrismaSchemaFileProps> => {
    const result: IValidation<IMakePrismaSchemaFileProps> =
      typia.validate<IMakePrismaSchemaFileProps>(input);
    if (result.success === false) return result;

    const expected: string[] = props.expected;
    const actual: string[] = result.data.file.models.map((m) => m.name);
    const missed: string[] = expected.filter((x) => !actual.includes(x));
    if (expected.length === actual.length && missed.length === 0) return result;

    const tables = (array: string[]) => array.map((x) => `- ${x}`).join("\n");
    const description: string = AutoBeSystemPromptConstant.PRISMA_INSUFFICIENT
      // COUNTS
      .replaceAll("{{expectedCount}}", expected.length.toString())
      .replaceAll("{{actualCount}}", actual.length.toString())
      .replaceAll("{{missingCount}}", missed.length.toString())
      // TABLE LISTS
      .replaceAll("{{expectedTables}}", tables(expected))
      .replaceAll("{{actualTables}}", tables(actual))
      .replaceAll("{{missingTables}}", tables(missed))
      // INLINE
      .replaceAll("{{expectedInline}}", expected.join(", "));
    ctx.dispatch({
      type: "prismaInsufficient",
      completed: result.data.file,
      expected,
      missed,
      created_at: new Date().toISOString(),
    });
    return {
      success: false,
      data: result.data,
      errors: [
        {
          path: "$input.file.models",
          value: result.data.file.models,
          expected: `Array<AutoBePrisma.IModel> & tags.MinLength<${length}> & tags.MaxLength<${length}>`,
          description,
        },
      ],
    };
  };
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
