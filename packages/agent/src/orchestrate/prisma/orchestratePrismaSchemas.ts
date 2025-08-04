import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBePrisma } from "@autobe/interface";
import { AutoBePrismaSchemasEvent } from "@autobe/interface/src/events/AutoBePrismaSchemasEvent";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

// import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { forceRetry } from "../../utils/forceRetry";
import { IAutoBePrismaSchemaApplication } from "./structures/IAutoBePrismaSchemaApplication";
import { transformPrismaSchemaHistories } from "./transformPrismaSchemaHistories";

export async function orchestratePrismaSchemas<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  components: AutoBePrisma.IComponent[],
): Promise<AutoBePrismaSchemasEvent[]> {
  const start: Date = new Date();
  const total: number = components
    .map((c) => c.tables.length)
    .reduce((x, y) => x + y, 0);
  let completed: number = 0;
  return await Promise.all(
    components.map(async (comp) => {
      const targetComponent: AutoBePrisma.IComponent = comp;
      const otherComponents: AutoBePrisma.IComponent[] = components.filter(
        (y) => comp !== y,
      );
      const result: IAutoBePrismaSchemaApplication.IProps = await forceRetry(
        () => process(ctx, targetComponent, otherComponents),
      );
      const event: AutoBePrismaSchemasEvent = {
        type: "prismaSchemas",
        created_at: start.toISOString(),
        thinking: result.thinking,
        draft: result.draft,
        review: result.review,
        final: result.final,
        file: {
          filename: comp.filename,
          namespace: comp.namespace,
          models: result.models,
        },
        completed: (completed += comp.tables.length),
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
  targetComponent: AutoBePrisma.IComponent,
  otherComponents: AutoBePrisma.IComponent[],
): Promise<IAutoBePrismaSchemaApplication.IProps> {
  const pointer: IPointer<IAutoBePrismaSchemaApplication.IProps | null> = {
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
      ctx.state().analyze!.files,
      targetComponent,
      otherComponents,
    ),
    controllers: [
      createApplication(ctx, {
        targetComponent,
        otherComponents,
        build: (next) => {
          pointer.value = next;
        },
      }),
    ],
  });
  enforceToolCall(agentica);

  await agentica.conversate("Make prisma schema file please").finally(() => {
    const tokenUsage = agentica.getTokenUsage().aggregate;
    ctx.usage().record(tokenUsage, ["prisma"]);
  });
  if (pointer.value === null)
    throw new Error("Unreachable code: Prisma Schema not generated");
  return pointer.value;
}

function createApplication<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    targetComponent: AutoBePrisma.IComponent;
    otherComponents: AutoBePrisma.IComponent[];
    build: (next: IAutoBePrismaSchemaApplication.IProps) => void;
  },
): IAgenticaController.IClass<Model> {
  assertSchemaModel(ctx.model);
  const application: ILlmApplication<Model> = collection[
    ctx.model
  ] as unknown as ILlmApplication<Model>;
  // application.functions[0].validate = (
  //   input: unknown,
  // ): IValidation<IMakePrismaSchemaFileProps> => {
  //   const result: IValidation<IMakePrismaSchemaFileProps> =
  //     typia.validate<IMakePrismaSchemaFileProps>(input);
  //   if (result.success === false) return result;

  //   const everyModels: AutoBePrisma.IModel[] = result.data.models;
  //   result.data.models = result.data.models.filter((m) =>
  //     props.otherComponents.every((oc) => oc.tables.includes(m.name) === false),
  //   );
  //   const expected: string[] = props.targetComponent.tables;
  //   const actual: string[] = result.data.models.map((m) => m.name);
  //   const missed: string[] = expected.filter(
  //     (x) => actual.includes(x) === false,
  //   );
  //   if (missed.length === 0) return result;

  //   ctx.dispatch({
  //     type: "prismaInsufficient",
  //     created_at: new Date().toISOString(),
  //     component: props.targetComponent,
  //     actual: everyModels,
  //     missed,
  //     tablesToCreate: result.data.tablesToCreate,
  //     validationReview: result.data.validationReview,
  //     confirmedTables: result.data.confirmedTables,
  //   });
  //   return {
  //     success: false,
  //     data: result.data,
  //     errors: [
  //       {
  //         path: "$input.file.models",
  //         value: result.data.models,
  //         expected: `Array<AutoBePrisma.IModel>`,
  //         description: [
  //           "You missed some tables from the current domain's component.",
  //           "",
  //           "Look at the following details to fix the schemas. Never forget to",
  //           "compose the `missed` tables at the next function calling.",
  //           "",
  //           "- filename: current domain's filename",
  //           "- namespace: current domain's namespace",
  //           "- expected: expected tables in the current domain",
  //           "- actual: actual tables you made",
  //           "- missed: tables you have missed, and you have to compose again",
  //           "",
  //           JSON.stringify({
  //             filename: props.targetComponent.filename,
  //             namespace: props.targetComponent.namespace,
  //             expected,
  //             actual,
  //             missed,
  //           }),
  //         ].join("\n"),
  //       },
  //     ],
  //   };
  // };
  return {
    protocol: "class",
    name: "Prisma Generator",
    application,
    execute: {
      makePrismaSchemaFile: (next) => {
        props.build(next);
      },
    } satisfies IAutoBePrismaSchemaApplication,
  };
}

const claude = typia.llm.application<
  IAutoBePrismaSchemaApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBePrismaSchemaApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
