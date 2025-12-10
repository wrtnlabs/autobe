import { IAgenticaController } from "@agentica/core";
import { AutoBeEventSource, AutoBePrisma } from "@autobe/interface";
import { AutoBePrismaSchemaEvent } from "@autobe/interface/src/events/AutoBePrismaSchemaEvent";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaSchemaHistory } from "./histories/transformPrismaSchemaHistory";
import { IAutoBePrismaSchemaApplication } from "./structures/IAutoBePrismaSchemaApplication";

export async function orchestratePrismaSchema<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  instruction: string,
  componentList: AutoBePrisma.IComponent[],
): Promise<AutoBePrismaSchemaEvent[]> {
  const start: Date = new Date();
  const total: number = componentList
    .map((c) => c.tables.length)
    .reduce((x, y) => x + y, 0);
  const completed: IPointer<number> = { value: 0 };
  return await executeCachedBatch(
    ctx,
    componentList.map((component) => async (promptCacheKey) => {
      const otherTables: string[] = componentList
        .filter((y) => component !== y)
        .map((c) => c.tables)
        .flat();
      const event: AutoBePrismaSchemaEvent = await process(ctx, {
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
): Promise<AutoBePrismaSchemaEvent> {
  const preliminary: AutoBePreliminaryController<"analysisFiles"> =
    new AutoBePreliminaryController({
      application: typia.json.application<IAutoBePrismaSchemaApplication>(),
      source: SOURCE,
      kinds: ["analysisFiles"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBePrismaSchemaApplication.IComplete | null> = {
      value: null,
    };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: SOURCE,
      controller: createController(ctx, {
        preliminary,
        targetComponent: props.component,
        otherTables: props.otherTables,
        build: (next) => {
          pointer.value = next;
        },
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformPrismaSchemaHistory({
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
    });
    if (pointer.value !== null)
      return out(result)({
        type: SOURCE,
        id: v7(),
        created_at: props.start.toISOString(),
        plan: pointer.value.plan,
        models: pointer.value.models,
        file: {
          filename: props.component.filename,
          namespace: props.component.namespace,
          models: pointer.value.models,
        },
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        completed: (props.completed.value += props.component.tables.length),
        total: props.total,
        step: ctx.state().analyze?.step ?? 0,
      } satisfies AutoBePrismaSchemaEvent);
    return out(result)(null);
  });
}

function createController<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    preliminary: AutoBePreliminaryController<"analysisFiles">;
    targetComponent: AutoBePrisma.IComponent;
    otherTables: string[];
    build: (next: IAutoBePrismaSchemaApplication.IComplete) => void;
  },
): IAgenticaController.IClass<Model> {
  assertSchemaModel(ctx.model);

  const validate = (
    input: unknown,
  ): IValidation<IAutoBePrismaSchemaApplication.IProps> => {
    const result: IValidation<IAutoBePrismaSchemaApplication.IProps> =
      defaultValidate(input);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const actual: AutoBePrisma.IModel[] = result.data.request.models;
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
          path: "$input.request.models",
          value: result.data.request.models,
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
    ctx.model === "chatgpt"
      ? "chatgpt"
      : ctx.model === "gemini"
        ? "gemini"
        : "claude"
  ](
    validate,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBePrismaSchemaApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBePrismaSchemaApplication, "chatgpt">({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBePrismaSchemaApplication, "claude">({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBePrismaSchemaApplication, "gemini">({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBePrismaSchemaApplication.IProps>;

const defaultValidate: Validator =
  typia.createValidate<IAutoBePrismaSchemaApplication.IProps>();

const SOURCE = "prismaSchema" satisfies AutoBeEventSource;
