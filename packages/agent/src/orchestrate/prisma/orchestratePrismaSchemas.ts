import { IAgenticaController } from "@agentica/core";
import { AutoBePrisma } from "@autobe/interface";
import { AutoBePrismaSchemasEvent } from "@autobe/interface/src/events/AutoBePrismaSchemasEvent";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { transformPrismaSchemaHistories } from "./histories/transformPrismaSchemaHistories";
import { IAutoBePrismaSchemaApplication } from "./structures/IAutoBePrismaSchemaApplication";

export async function orchestratePrismaSchemas<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  instruction: string,
  componentList: AutoBePrisma.IComponent[],
): Promise<AutoBePrismaSchemasEvent[]> {
  const start: Date = new Date();
  const total: number = componentList
    .map((c) => c.tables.length)
    .reduce((x, y) => x + y, 0);
  const completed: IPointer<number> = { value: 0 };
  return await executeCachedBatch(
    componentList.map((component) => async (promptCacheKey) => {
      const otherTables: string[] = componentList
        .filter((y) => component !== y)
        .map((c) => c.tables)
        .flat();
      const event: AutoBePrismaSchemasEvent = await process(ctx, {
        instruction,
        component,
        otherTables,
        start,
        total,
        completed,
        promptCacheKey,
      });
      ctx.dispatch(event);
      return event;
    }),
  );
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    component: AutoBePrisma.IComponent;
    otherTables: string[];
    start: Date;
    total: number;
    completed: IPointer<number>;
    promptCacheKey: string;
  },
): Promise<AutoBePrismaSchemasEvent> {
  const pointer: IPointer<IAutoBePrismaSchemaApplication.IProps | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "prismaSchemas",
    histories: transformPrismaSchemaHistories({
      analysis:
        ctx
          .state()
          .analyze?.files.map((file) => ({ [file.filename]: file.content }))
          .reduce((acc, cur) => {
            return Object.assign(acc, cur);
          }, {}) ?? {},
      targetComponent: props.component,
      otherTables: props.otherTables,
      instruction: props.instruction,
    }),
    controller: createController(ctx, {
      targetComponent: props.component,
      otherTables: props.otherTables,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    promptCacheKey: props.promptCacheKey,
    message: "Make prisma schema file please",
  });
  if (pointer.value === null)
    throw new Error("Unreachable code: Prisma Schema not generated");
  return {
    type: "prismaSchemas",
    id: v7(),
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
      id: v7(),
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
          description: StringUtil.trim`
            You missed some tables from the current domain's component.

            Look at the following details to fix the schemas. Never forget to
            compose the \`missed\` tables at the next function calling.

            - filename: current domain's filename
            - namespace: current domain's namespace
            - expected: expected tables in the current domain
            - actual: actual tables you made
            - missed: tables you have missed, and you have to compose again

            ${JSON.stringify({
              filename: props.targetComponent.filename,
              namespace: props.targetComponent.namespace,
              expected,
              actual,
              missed,
            })}
          `,
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
