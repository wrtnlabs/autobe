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
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
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
  const cyclinic = new AutoBeCyclinicController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >({
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

  return cyclinic.orchestrate<
    IAutoBeDatabaseSchemaApplication.IWrite,
    AutoBeDatabaseSchemaEvent
  >(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeDatabaseSchemaApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          cyclinic,
          targetComponent: props.component,
          otherComponents: props.otherComponents,
          design: props.design,
          action,
        }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...transformPrismaSchemaHistory({
          component: props.component,
          design: props.design,
          otherComponents: props.otherComponents,
          instruction: props.instruction,
          preliminary: context.preliminary,
        }),
      });
      return { result, action: action.value };
    },
    // VALIDATE: run business logic validation
    async (writeData) => {
      const errors: IValidation.IError[] = [];
      AutoBeDatabaseSchemaProgrammer.validate({
        path: "$input.request.definition",
        errors,
        targetTable: props.design.name,
        otherTables: [props.component, ...props.otherComponents]
          .flatMap((c) => c.tables.map((t) => t.name))
          .filter((s) => s !== props.design.name),
        definition: writeData.definition,
      });
      if (errors.length !== 0) return { success: false, diagnostics: errors };
      return { success: true };
    },
    // FINALIZE: build result, dispatch event, return
    async (lastWrite, result) => {
      return {
        type: SOURCE,
        id: v7(),
        created_at: props.start.toISOString(),
        plan: lastWrite.plan,
        namespace: props.component.namespace,
        definition: lastWrite.definition,
        acquisition: cyclinic.getPreliminary().getAcquisition(),
        metric: result?.metric ?? {
          attempt: 0,
          success: 0,
          consent: 0,
          validationFailure: 0,
          invalidJson: 0,
        },
        tokenUsage: result?.tokenUsage ?? {
          total: 0,
          input: { total: 0, cached: 0 },
          output: {
            total: 0,
            reasoning: 0,
            accepted_prediction: 0,
            rejected_prediction: 0,
          },
        },
        completed: ++props.progress.completed,
        total: props.progress.total,
        step: ctx.state().analyze?.step ?? 0,
      } satisfies AutoBeDatabaseSchemaEvent;
    },
  );
}

function createController(props: {
  cyclinic: AutoBeCyclinicController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >;
  targetComponent: AutoBeDatabaseComponent;
  otherComponents: AutoBeDatabaseComponent[];
  design: AutoBeDatabaseComponentTableDesign;
  action: IPointer<
    | {
        type: "write";
        data: IAutoBeDatabaseSchemaApplication.IWrite;
      }
    | { type: "complete" }
    | null
  >;
}): IAgenticaController.IClass {
  const preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  > = props.cyclinic.getPreliminary();

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeDatabaseSchemaApplication.IProps> =
      typia.validate<IAutoBeDatabaseSchemaApplication.IProps>(input);
    if (result.success === false) return result;
    const req = result.data.request;
    if (req.type === "write" || req.type === "complete") return result;
    return preliminary.validate({
      thinking: result.data.thinking,
      request: req,
    });
  };
  const application: ILlmApplication = props.cyclinic.fixCompleteAvailability(
    preliminary.fixApplication(
      typia.llm.application<IAutoBeDatabaseSchemaApplication>({
        validate: {
          process: validate,
        },
      }),
    ),
  );
  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "write")
          props.action.value = { type: "write", data: next.request };
        else if (next.request.type === "complete")
          props.action.value = { type: "complete" };
      },
    } satisfies IAutoBeDatabaseSchemaApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeDatabaseSchemaApplication.IProps>;

const SOURCE = "databaseSchema" satisfies AutoBeEventSource;
