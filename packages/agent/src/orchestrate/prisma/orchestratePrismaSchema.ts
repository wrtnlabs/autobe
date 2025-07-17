import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBePrisma } from "@autobe/interface";
import { AutoBePrismaSchemasEvent } from "@autobe/interface/src/events/AutoBePrismaSchemasEvent";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

// import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
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
  const total: number = components
    .map((c) => c.tables.length)
    .reduce((x, y) => x + y, 0);
  let i: number = 0;
  return await Promise.all(
    components.map(async (c, x) => {
      const result: IMakePrismaSchemaFileProps = await forceRetry(() =>
        process(
          ctx,
          c, // mine
          components.filter((_, y) => x !== y), // others
        ),
      );
      const event: AutoBePrismaSchemasEvent = {
        type: "prismaSchemas",
        created_at: start.toISOString(),
        file: {
          filename: c.filename,
          namespace: c.namespace,
          models: result.models,
        },
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
        component,
        otherComponents,
        build: (next) => {
          pointer.value = next;
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
    component: AutoBePrisma.IComponent;
    otherComponents: AutoBePrisma.IComponent[];
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

    result.data.models = result.data.models.filter((m) =>
      props.otherComponents.every(
        (oc) => !oc.tables.includes(m.name) === false,
      ),
    );
    const expected: string[] = props.component.tables;
    const actual: string[] = result.data.models.map((m) => m.name);
    const missed: string[] = expected.filter((x) => !actual.includes(x));

    ctx.dispatch({
      type: "prismaInsufficient",
      component: props.component,
      actual: result.data.models,
      missed,
      created_at: new Date().toISOString(),
    });
    return {
      success: false,
      data: result.data,
      errors: [
        {
          path: "$input.file.models",
          value: result.data.models,
          expected: `Array<AutoBePrisma.IModel>`,
          description: [
            "You missed some tables from the current domain's component.",
            "",
            "Look at the following details to fix the schemas. Never forget to",
            "compose the `missed` tables at the next function calling.",
            "",
            "- filename: current domain's filename",
            "- namespace: current domain's namespace",
            "- expected: expected tables in the current domain",
            "- actual: actual tables you made",
            "- missed: tables you have missed, and you have to compose again",
            "",
            JSON.stringify({
              filename: props.component.filename,
              namespace: props.component.namespace,
              expected,
              actual,
              missed,
            }),
          ].join("\n"),
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
   * Array of Prisma models (database tables) within the domain.
   *
   * Each model represents a business entity or concept within the namespace.
   * Models can reference each other through foreign key relationships.
   */
  models: AutoBePrisma.IModel[];
}
