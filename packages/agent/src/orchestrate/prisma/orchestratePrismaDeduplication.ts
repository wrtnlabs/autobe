import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseDeduplicationEvent,
  AutoBeEventSource,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaDeduplicationHistory } from "./histories/transformPrismaDeduplicationHistory";
import { AutoBeDatabaseDeduplicationProgrammer } from "./programmers/AutoBeDatabaseDeduplicationProgrammer";
import { IAutoBeDatabaseDeduplicationApplication } from "./structures/IAutoBeDatabaseDeduplicationApplication";

export async function orchestratePrismaDeduplication(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    components: AutoBeDatabaseComponent[];
  },
): Promise<AutoBeDatabaseComponent[]> {
  const prefix: string | null = ctx.state().analyze?.prefix ?? null;
  const progress: AutoBeProgressEventBase = {
    completed: 0,
    total: props.components.length,
  };
  const events: AutoBeDatabaseDeduplicationEvent[] = await executeCachedBatch(
    ctx,
    props.components.map((component) => async (promptCacheKey) => {
      const event: AutoBeDatabaseDeduplicationEvent = await process(ctx, {
        target: component,
        allComponents: props.components,
        instruction: props.instruction,
        prefix,
        progress,
        promptCacheKey,
      });
      ctx.dispatch(event);
      return event;
    }),
  );
  // Resolve duplicates
  const results: AutoBeDatabaseComponent[] =
    AutoBeDatabaseDeduplicationProgrammer.resolve(props.components, events);

  return results;
}

async function process(
  ctx: AutoBeContext,
  props: {
    target: AutoBeDatabaseComponent;
    allComponents: AutoBeDatabaseComponent[];
    instruction: string;
    prefix: string | null;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeDatabaseDeduplicationEvent> {
  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeDatabaseDeduplicationApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "previousAnalysisFiles",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
  });

  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeDatabaseDeduplicationApplication.IComplete | null> =
      {
        value: null,
      };

    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        preliminary,
        target: props.target,
        allComponents: props.allComponents,
        build: (next) => {
          pointer.value = next;
        },
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformPrismaDeduplicationHistory({
        component: props.target,
        allComponents: props.allComponents,
        instruction: props.instruction,
        prefix: props.prefix,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    return out(result)({
      type: SOURCE,
      id: v7(),
      created_at: new Date().toISOString(),
      step: ctx.state().analyze?.step ?? 0,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      completed: ++props.progress.completed,
      total: props.progress.total,
      analysis: pointer.value.analysis,
      rationale: pointer.value.rationale,
      duplicateGroups: pointer.value.duplicateGroups,
      namespace: props.target.namespace,
    });
  });
}

function createController(props: {
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  >;
  target: AutoBeDatabaseComponent;
  allComponents: AutoBeDatabaseComponent[];
  build: (next: IAutoBeDatabaseDeduplicationApplication.IComplete) => void;
}): IAgenticaController.IClass {
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeDatabaseDeduplicationApplication.IProps> =
      typia.validate<IAutoBeDatabaseDeduplicationApplication.IProps>(input);
    if (result.success === false) return result;

    if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = [];
    AutoBeDatabaseDeduplicationProgrammer.validate({
      errors,
      path: "$input.request.duplicateGroups",
      target: props.target,
      allComponents: props.allComponents,
      duplicateGroups: result.data.request.duplicateGroups,
    });
    if (errors.length > 0)
      return {
        success: false,
        errors,
        data: result.data,
      };
    return result;
  };
  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeDatabaseDeduplicationApplication>({
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
    } satisfies IAutoBeDatabaseDeduplicationApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeDatabaseDeduplicationApplication.IProps>;

const SOURCE = "databaseDeduplication" satisfies AutoBeEventSource;
