import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeDatabaseComponent,
  AutoBeDatabaseSchemaEvent,
  AutoBeEventSource,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaSchemaHistory } from "./histories/transformPrismaSchemaHistory";
import { IAutoBeDatabaseSchemaApplication } from "./structures/IAutoBeDatabaseSchemaApplication";

export async function orchestratePrismaSchema(
  ctx: AutoBeContext,
  instruction: string,
  componentList: AutoBeDatabaseComponent[],
): Promise<AutoBeDatabaseSchemaEvent[]> {
  const start: Date = new Date();
  const total: number = componentList
    .map((c) => c.tables.length)
    .reduce((x, y) => x + y, 0);
  const completed: IPointer<number> = { value: 0 };

  // Flatten component list into individual table tasks
  const tableTasks: Array<{
    component: AutoBeDatabaseComponent;
    table: string;
  }> = componentList.flatMap((component) =>
    component.tables.map((table) => ({ component, table: table.name })),
  );

  return await executeCachedBatch(
    ctx,
    tableTasks.map((task) => async (promptCacheKey) => {
      const otherComponents: AutoBeDatabaseComponent[] = componentList.filter(
        (c) => c !== task.component,
      );
      const event: AutoBeDatabaseSchemaEvent = await process(ctx, {
        instruction,
        targetComponent: task.component,
        targetTable: task.table,
        otherComponents,
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

async function process(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    targetComponent: AutoBeDatabaseComponent;
    targetTable: string;
    otherComponents: AutoBeDatabaseComponent[];
    start: Date;
    total: number;
    completed: IPointer<number>;
    promptCacheKey: string;
  },
): Promise<AutoBeDatabaseSchemaEvent> {
  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeDatabaseSchemaApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "previousAnalysisFiles",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeDatabaseSchemaApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        preliminary,
        targetComponent: props.targetComponent,
        targetTable: props.targetTable,
        build: (next) => {
          pointer.value = next;
        },
        dispatch: ctx.dispatch,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformPrismaSchemaHistory({
        targetComponent: props.targetComponent,
        targetTable: props.targetTable,
        otherComponents: props.otherComponents,
        instruction: props.instruction,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);
    return out(result)({
      type: SOURCE,
      id: v7(),
      created_at: props.start.toISOString(),
      plan: pointer.value.plan,
      namespace: props.targetComponent.namespace,
      model: pointer.value.model,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      completed: ++props.completed.value,
      total: props.total,
      step: ctx.state().analyze?.step ?? 0,
    } satisfies AutoBeDatabaseSchemaEvent);
  });
}

function createController(props: {
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  >;
  targetComponent: AutoBeDatabaseComponent;
  targetTable: string;
  build: (next: IAutoBeDatabaseSchemaApplication.IComplete) => void;
  dispatch: AutoBeContext["dispatch"];
}): IAgenticaController.IClass {
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeDatabaseSchemaApplication.IProps> =
      typia.validate<IAutoBeDatabaseSchemaApplication.IProps>(input);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    // Validate that the generated model matches the target table name
    const actual: AutoBeDatabase.IModel = result.data.request.model;
    const expected: string = props.targetTable;

    if (actual.name === expected) return result;
    return {
      success: false,
      data: result.data,
      errors: [
        {
          path: "$input.request.model.name",
          value: actual.name,
          expected: JSON.stringify(expected),
          description: StringUtil.trim`
            You created a model with the wrong table name.

            You are responsible for creating exactly ONE table with the exact name specified.

            - filename: current domain's filename
            - namespace: current domain's namespace
            - expected table name: ${expected}
            - actual table name: ${actual.name}

            ${JSON.stringify({
              filename: props.targetComponent.filename,
              namespace: props.targetComponent.namespace,
              targetTable: expected,
              actualTableName: actual.name,
            })}
          `,
        },
      ],
    };
  };
  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeDatabaseSchemaApplication>({
      validate: {
        process: validate,
      },
    }),
  );
  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBeDatabaseSchemaApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeDatabaseSchemaApplication.IProps>;

const SOURCE = "databaseSchema" satisfies AutoBeEventSource;
