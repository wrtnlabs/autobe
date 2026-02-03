import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseGroup,
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
import { transformPrismaComponentsHistory } from "./histories/transformPrismaComponentsHistory";
import { AutoBeDatabaseComponentProgrammer } from "./programmers/AutoBeDatabaseComponentProgrammer";
import { IAutoBeDatabaseComponentApplication } from "./structures/IAutoBeDatabaseComponentApplication";

export async function orchestratePrismaComponent(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    groups: AutoBeDatabaseGroup[];
  },
): Promise<AutoBeDatabaseComponent[]> {
  // Filter to only process domain groups - authorization groups are handled
  // by orchestratePrismaAuthorization separately
  const domainGroups = props.groups.filter((g) => g.kind === "domain");
  if (domainGroups.length === 0) return [];

  const prefix: string | null = ctx.state().analyze?.prefix ?? null;
  const progress: AutoBeProgressEventBase = {
    completed: 0,
    total: domainGroups.length,
  };

  const components: AutoBeDatabaseComponent[] = await executeCachedBatch(
    ctx,
    domainGroups.map((group) => async (promptCacheKey) => {
      const component: AutoBeDatabaseComponent = await process(ctx, {
        group,
        instruction: props.instruction,
        prefix,
        progress,
        promptCacheKey,
      });
      return component;
    }),
  );
  return AutoBeDatabaseComponentProgrammer.removeDuplicatedTable(components);
}

async function process(
  ctx: AutoBeContext,
  props: {
    group: AutoBeDatabaseGroup;
    instruction: string;
    prefix: string | null;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeDatabaseComponent> {
  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeDatabaseComponentApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "previousAnalysisFiles",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
  });

  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeDatabaseComponentApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        pointer,
        preliminary,
        prefix: props.prefix,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformPrismaComponentsHistory(ctx.state(), {
        instruction: props.instruction,
        prefix: props.prefix,
        preliminary,
        group: props.group,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    // Build complete component from group skeleton + tables
    const component: AutoBeDatabaseComponent = {
      ...props.group,
      tables: pointer.value.tables,
    };
    ctx.dispatch({
      type: SOURCE,
      id: v7(),
      created_at: new Date().toISOString(),
      analysis: pointer.value.analysis,
      rationale: pointer.value.rationale,
      component,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      step: ctx.state().analyze?.step ?? 0,
      total: props.progress.total,
      completed: ++props.progress.completed,
    });
    return out(result)(component);
  });
}

function createController(props: {
  pointer: IPointer<IAutoBeDatabaseComponentApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  >;
  prefix: string | null;
}): IAgenticaController.IClass {
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeDatabaseComponentApplication.IProps> =
      typia.validate<IAutoBeDatabaseComponentApplication.IProps>(input);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = [];
    AutoBeDatabaseComponentProgrammer.validate({
      errors,
      prefix: props.prefix,
      tables: result.data.request.tables,
      path: "$input.request.tables",
    });
    if (errors.length > 0)
      return {
        success: false,
        data: result.data,
        errors,
      };
    return result;
  };
  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeDatabaseComponentApplication>({
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
      process: (input) => {
        if (input.request.type === "complete")
          props.pointer.value = input.request;
      },
    } satisfies IAutoBeDatabaseComponentApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeDatabaseComponentApplication.IProps>;

const SOURCE = "databaseComponent" satisfies AutoBeEventSource;
