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
import { transformPrismaSchemaHistories } from "./histories/transformPrismaSchemaHistories";
import { IAutoBePrismaSchemaApplication } from "./structures/IAutoBePrismaSchemaApplication";

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
        () =>
          process(
            ctx,
            targetComponent,
            otherComponents.map((c) => c.tables).flat(),
          ),
      );
      const models: AutoBePrisma.IModel[] = mergeModels(result);
      const event: AutoBePrismaSchemasEvent = {
        type: "prismaSchemas",
        created_at: start.toISOString(),
        plan: result.plan,
        draft: result.draft,
        review: result.review,
        modifications: result.modifications,
        file: {
          filename: comp.filename,
          namespace: comp.namespace,
          models,
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
  otherTables: string[],
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
      otherTables,
    ),
    controllers: [
      createApplication(ctx, {
        targetComponent,
        otherTables,
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

const mergeModels = (props: {
  draft: AutoBePrisma.IModel[];
  modifications: AutoBePrisma.IModel[];
}): AutoBePrisma.IModel[] =>
  Array.from(
    new Map([
      ...props.draft.map(
        (draft) => [draft.name, draft] satisfies [string, AutoBePrisma.IModel],
      ),
      ...props.modifications.map(
        (mod) => [mod.name, mod] satisfies [string, AutoBePrisma.IModel],
      ),
    ]).values(),
  );

function createApplication<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    targetComponent: AutoBePrisma.IComponent;
    otherTables: string[];
    build: (next: IAutoBePrismaSchemaApplication.IProps) => void;
  },
): IAgenticaController.IClass<Model> {
  assertSchemaModel(ctx.model);

  const validate = (
    input: unknown,
  ): IValidation<IAutoBePrismaSchemaApplication.IProps> => {
    const result: IValidation<IAutoBePrismaSchemaApplication.IProps> =
      typia.validate<IAutoBePrismaSchemaApplication.IProps>(input);
    if (result.success === false) return result;

    const actual: AutoBePrisma.IModel[] = mergeModels(result.data);
    const expected: string[] = props.targetComponent.tables;
    const missed: string[] = expected.filter(
      (x) => actual.some((a) => a.name === x) === false,
    );
    if (missed.length === 0) return result;

    ctx.dispatch({
      type: "prismaInsufficient",
      created_at: new Date().toISOString(),
      component: props.targetComponent,
      actual,
      missed,
    });
    return {
      success: false,
      data: result.data,
      errors: [
        {
          path: "$input.file.draft",
          value: result.data.draft,
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
              filename: props.targetComponent.filename,
              namespace: props.targetComponent.namespace,
              expected,
              actual,
              missed,
            }),
          ].join("\n"),
        },
      ],
    };
  };
  const application: ILlmApplication<Model> = collection[
    ctx.model === "chatgpt" ? "chatgpt" : "claude"
  ](
    validate,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
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

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBePrismaSchemaApplication, "chatgpt">({
      validate: {
        makePrismaSchemaFile: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBePrismaSchemaApplication, "claude">({
      validate: {
        makePrismaSchemaFile: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBePrismaSchemaApplication.IProps>;
