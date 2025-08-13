import { IAgenticaController } from "@agentica/core";
import { AutoBePrisma } from "@autobe/interface";
import { AutoBePrismaSchemasEvent } from "@autobe/interface/src/events/AutoBePrismaSchemasEvent";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformPrismaSchemaHistories } from "./histories/transformPrismaSchemaHistories";
import { IAutoBePrismaSchemaApplication } from "./structures/IAutoBePrismaSchemaApplication";

export async function orchestratePrismaSchemas<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  componentList: AutoBePrisma.IComponent[],
): Promise<AutoBePrismaSchemasEvent[]> {
  const start: Date = new Date();
  const total: number = componentList
    .map((c) => c.tables.length)
    .reduce((x, y) => x + y, 0);
  const completed: IPointer<number> = { value: 0 };
  return await Promise.all(
    componentList.map(async (component) => {
      const otherTables: string[] = componentList
        .filter((y) => component !== y)
        .map((c) => c.tables)
        .flat();
      const event: AutoBePrismaSchemasEvent = await process(ctx, {
        component,
        otherTables,
        start,
        total,
        completed,
      });
      ctx.dispatch(event);
      return event;
    }),
  );
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    component: AutoBePrisma.IComponent;
    otherTables: string[];
    start: Date;
    total: number;
    completed: IPointer<number>;
  },
): Promise<AutoBePrismaSchemasEvent> {
  const pointer: IPointer<IAutoBePrismaSchemaApplication.IProps | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "prismaSchemas",
    histories: transformPrismaSchemaHistories(
      ctx
        .state()
        .analyze?.files.map((file) => ({ [file.filename]: file.content }))
        .reduce((acc, cur) => {
          return Object.assign(acc, cur);
        }, {}) ?? {},
      props.component,
      props.otherTables,
    ),
    controller: createController(ctx, {
      targetComponent: props.component,
      otherTables: props.otherTables,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    message: "Make prisma schema file please",
  });
  if (pointer.value === null)
    throw new Error("Unreachable code: Prisma Schema not generated");
  return {
    type: "prismaSchemas",
    created_at: props.start.toISOString(),
    plan: pointer.value.plan,
    models: pointer.value.models,
    file: {
      filename: props.component.filename,
      namespace: props.component.namespace,
      models: pointer.value.models,
    },
    tokenUsage,
    completed: (props.completed.value += props.component.tables.length),
    total: props.total,
    step: ctx.state().analyze?.step ?? 0,
  } satisfies AutoBePrismaSchemasEvent;
}

function createController<Model extends ILlmSchema.Model>(
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

    const actual: AutoBePrisma.IModel[] = result.data.models;
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
          path: "$input.models",
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
