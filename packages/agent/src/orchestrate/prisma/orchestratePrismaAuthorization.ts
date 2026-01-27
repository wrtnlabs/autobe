import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeActor,
  AutoBeDatabaseComponent,
  AutoBeDatabaseComponentTableDesign,
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
import { transformPrismaAuthorizationHistory } from "./histories/transformPrismaAuthorizationHistory";
import { AutoBeDatabaseAuthorizationProgrammer } from "./programmers/AutoBeDatabaseAuthorizationProgrammer";
import { AutoBeDatabaseComponentProgrammer } from "./programmers/AutoBeDatabaseComponentProgrammer";
import { IAutoBeDatabaseAuthorizationApplication } from "./structures/IAutoBeDatabaseAuthorizationApplication";

export async function orchestratePrismaAuthorization(
  ctx: AutoBeContext,
  props: {
    groups: AutoBeDatabaseGroup[];
    instruction: string;
  },
): Promise<AutoBeDatabaseComponent[]> {
  const authorizationGroup: AutoBeDatabaseGroup | undefined = props.groups
    .filter((g) => g.kind === "authorization")
    .at(0);
  if (authorizationGroup === undefined) return [];
  const actors: AutoBeAnalyzeActor[] = ctx.state().analyze?.actors ?? [];
  const prefix: string | null = ctx.state().analyze?.prefix ?? null;
  const progress: AutoBeProgressEventBase = {
    completed: 0,
    total: actors.length,
  };

  const components: AutoBeDatabaseComponent[] = await executeCachedBatch(
    ctx,
    actors.map((actor) => async (promptCacheKey) => {
      const component: AutoBeDatabaseComponent = await process(ctx, {
        actor,
        prefix,
        group: authorizationGroup,
        instruction: props.instruction,
        progress,
        promptCacheKey,
      });
      return component;
    }),
  );
  const deduped: AutoBeDatabaseComponent[] =
    AutoBeDatabaseComponentProgrammer.removeDuplicatedTable(components);
  const tables: AutoBeDatabaseComponentTableDesign[] = deduped.flatMap(
    (c) => c.tables,
  );
  return [{ ...authorizationGroup, tables }];
}

async function process(
  ctx: AutoBeContext,
  props: {
    actor: AutoBeAnalyzeActor;
    prefix: string | null;
    group: AutoBeDatabaseGroup;
    instruction: string;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeDatabaseComponent> {
  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeDatabaseAuthorizationApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "previousAnalysisFiles",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
  });

  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeDatabaseAuthorizationApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        pointer,
        preliminary,
        actor: props.actor,
        prefix: props.prefix,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformPrismaAuthorizationHistory({
        actor: props.actor,
        prefix: props.prefix,
        authGroup: props.group,
        instruction: props.instruction,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

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
      actorName: props.actor.name,
      actorKind: props.actor.kind,
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
  pointer: IPointer<IAutoBeDatabaseAuthorizationApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  >;
  actor: AutoBeAnalyzeActor;
  prefix: string | null;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeDatabaseAuthorizationApplication.IProps> => {
    const result: IValidation<IAutoBeDatabaseAuthorizationApplication.IProps> =
      typia.validate<IAutoBeDatabaseAuthorizationApplication.IProps>(input);
    if (result.success === false) return result;

    if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = [];
    AutoBeDatabaseAuthorizationProgrammer.validate({
      errors,
      path: "$input.request.tables",
      actor: props.actor,
      prefix: props.prefix,
      tables: result.data.request.tables,
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
    typia.llm.application<IAutoBeDatabaseAuthorizationApplication>({
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
    } satisfies IAutoBeDatabaseAuthorizationApplication,
  };
}

const SOURCE = "databaseAuthorization" satisfies AutoBeEventSource;
