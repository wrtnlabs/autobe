import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseComponentTableDesign,
  AutoBeDatabaseSchemaEvent,
  AutoBeEventSource,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaSchemaHistory } from "./histories/transformPrismaSchemaHistory";
import { AutoBeDatabaseSchemaProgrammer } from "./programmers/AutoBeDatabaseSchemaProgrammer";
import { IAutoBeDatabaseSchemaApplication } from "./structures/IAutoBeDatabaseSchemaApplication";

export async function orchestratePrismaSchema(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    components: AutoBeDatabaseComponent[];
    written: Set<string>;
    failed: Map<string, number>;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeDatabaseSchemaEvent[]> {
  const start: Date = new Date();
  const total: number = props.components
    .map(
      (c) => c.tables.filter((n) => props.written.has(n.name) === false).length,
    )
    .reduce((x, y) => x + y, 0);
  props.progress.total += total;

  // Flatten component list into individual table tasks
  const designPairs: Array<{
    component: AutoBeDatabaseComponent;
    design: AutoBeDatabaseComponentTableDesign;
  }> = props.components.flatMap((component) =>
    component.tables
      .filter((table) => props.written.has(table.name) === false)
      .map((table) => ({
        component,
        design: table,
      })),
  );
  const events: Array<AutoBeDatabaseSchemaEvent | null> =
    await executeCachedBatch(
      ctx,
      designPairs.map((task) => async (promptCacheKey) => {
        try {
          const otherComponents: AutoBeDatabaseComponent[] =
            props.components.filter((c) => c !== task.component);
          const event: AutoBeDatabaseSchemaEvent = await process(ctx, {
            instruction: props.instruction,
            progress: props.progress,
            component: task.component,
            design: task.design,
            otherComponents,
            start,
            promptCacheKey,
          });
          ctx.dispatch(event);
          return event;
        } catch (error) {
          --props.progress.total;
          console.log("database schema error", task.design.name, error);

          const count: number | undefined = props.failed.get(task.design.name);
          if (count === undefined) props.failed.set(task.design.name, 1);
          else if (count < 3) props.failed.set(task.design.name, count + 1);
          else throw error;

          return null;
        }
      }),
    );
  return events.filter((e) => e !== null);
}

async function process(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    progress: AutoBeProgressEventBase;
    component: AutoBeDatabaseComponent;
    design: AutoBeDatabaseComponentTableDesign;
    otherComponents: AutoBeDatabaseComponent[];
    start: Date;
    promptCacheKey: string;
  },
): Promise<AutoBeDatabaseSchemaEvent> {
  const preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  > = new AutoBePreliminaryController({
    dispatch: (e) => ctx.dispatch(e),
    application: typia.json.application<IAutoBeDatabaseSchemaApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "previousAnalysisSections",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
    config: {
      database: "ast",
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeDatabaseSchemaApplication.IWrite | null> = {
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
      definition: pointer.value.definition,
      acquisition: preliminary.getAcquisition(),
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      completed: ++props.progress.completed,
      total: props.progress.total,
      step: ctx.state().analyze?.step ?? 0,
    } satisfies AutoBeDatabaseSchemaEvent);
  });
}

function createController(props: {
  preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >;
  targetComponent: AutoBeDatabaseComponent;
  otherComponents: AutoBeDatabaseComponent[];
  design: AutoBeDatabaseComponentTableDesign;
  build: (next: IAutoBeDatabaseSchemaApplication.IWrite) => void;
  dispatch: AutoBeContext["dispatch"];
}): IAgenticaController.IClass {
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeDatabaseSchemaApplication.IProps> =
      typia.validate<IAutoBeDatabaseSchemaApplication.IProps>(input);
    if (result.success === false) return result;
    else if (result.data.request.type !== "write")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = [];
    AutoBeDatabaseSchemaProgrammer.validate({
      path: "$input.request.definition",
      errors,
      targetTable: props.design.name,
      otherTables: [props.targetComponent, ...props.otherComponents]
        .flatMap((c) => c.tables.map((t) => t.name))
        .filter((s) => s !== props.design.name),
      definition: result.data.request.definition,
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
        if (next.request.type === "write") props.build(next.request);
      },
    } satisfies IAutoBeDatabaseSchemaApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeDatabaseSchemaApplication.IProps>;

const SOURCE = "databaseSchema" satisfies AutoBeEventSource;
