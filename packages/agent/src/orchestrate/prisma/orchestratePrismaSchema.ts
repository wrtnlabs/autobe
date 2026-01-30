import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseComponentTableDesign,
  AutoBeDatabaseSchemaEvent,
  AutoBeEventSource,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaSchemaHistory } from "./histories/transformPrismaSchemaHistory";
import { AutoBeDatabaseSchemaProgrammer } from "./programmers/AutoBeDatabaseSchemaProgrammer";
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
  const designPairs: Array<{
    component: AutoBeDatabaseComponent;
    design: AutoBeDatabaseComponentTableDesign;
  }> = componentList.flatMap((component) =>
    component.tables.map((table) => ({
      component,
      design: table,
    })),
  );

  return await executeCachedBatch(
    ctx,
    designPairs.map((task) => async (promptCacheKey) => {
      const otherComponents: AutoBeDatabaseComponent[] = componentList.filter(
        (c) => c !== task.component,
      );
      const event: AutoBeDatabaseSchemaEvent = await process(ctx, {
        instruction,
        component: task.component,
        design: task.design,
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
    component: AutoBeDatabaseComponent;
    design: AutoBeDatabaseComponentTableDesign;
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
        targetComponent: props.component,
        otherComponents: props.otherComponents,
        design: props.design,
        build: (next) => {
          pointer.value = next;
        },
        dispatch: ctx.dispatch,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformPrismaSchemaHistory({
        component: props.component,
        design: props.design,
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
      namespace: props.component.namespace,
      models: pointer.value.models,
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
  otherComponents: AutoBeDatabaseComponent[];
  design: AutoBeDatabaseComponentTableDesign;
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

    const errors: IValidation.IError[] = [];
    AutoBeDatabaseSchemaProgrammer.validate({
      path: "$input.request.models",
      errors,
      targetTable: props.design.name,
      otherTables: [props.targetComponent, ...props.otherComponents]
        .flatMap((c) => c.tables.map((t) => t.name))
        .filter((s) => s !== props.design.name),
      models: result.data.request.models,
    });
    if (errors.length !== 0)
      return {
        success: false,
        data: result.data,
        errors,
      };
    return result;
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
