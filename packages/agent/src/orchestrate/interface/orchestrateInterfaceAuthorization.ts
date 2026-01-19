import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeActor,
  AutoBeEventSource,
  AutoBeInterfaceAuthorization,
  AutoBeInterfaceAuthorizationEvent,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceAuthorizationHistory } from "./histories/transformInterfaceAuthorizationHistory";
import { AutoBeInterfaceAuthorizationProgrammer } from "./programmers/AutoBeInterfaceAuthorizationProgrammer";
import { IAutoBeInterfaceAuthorizationApplication } from "./structures/IAutoBeInterfaceAuthorizationApplication";
import { AutoBeJsonSchemaFactory } from "./utils/AutoBeJsonSchemaFactory";

export async function orchestrateInterfaceAuthorization(
  ctx: AutoBeContext,
  props: {
    instruction: string;
  },
): Promise<AutoBeInterfaceAuthorization[]> {
  const actors: AutoBeAnalyzeActor[] = ctx.state().analyze?.actors ?? [];
  const progress: AutoBeProgressEventBase = {
    total: actors.length,
    completed: 0,
  };
  const authorizations: AutoBeInterfaceAuthorization[] =
    await executeCachedBatch(
      ctx,
      actors.map((a) => async (promptCacheKey) => {
        const event: AutoBeInterfaceAuthorizationEvent = await process(ctx, {
          actor: a,
          progress,
          promptCacheKey,
          instruction: props.instruction,
        });
        ctx.dispatch(event);
        return {
          name: a.name,
          operations: event.operations,
        };
      }),
    );
  return authorizations;
}

async function process(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    actor: AutoBeAnalyzeActor;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeInterfaceAuthorizationEvent> {
  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "previousAnalysisFiles"
    | "databaseSchemas"
    | "previousDatabaseSchemas"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceAuthorizationApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "previousAnalysisFiles",
      "databaseSchemas",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeInterfaceAuthorizationApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        actor: props.actor,
        build: (next) => {
          pointer.value = next;
        },
        preliminary,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformInterfaceAuthorizationHistory({
        state: ctx.state(),
        instruction: props.instruction,
        actor: props.actor,
        preliminary,
      }),
    });
    return out(result)(
      pointer.value !== null
        ? ({
            type: SOURCE,
            id: v7(),
            analysis: pointer.value.analysis,
            rationale: pointer.value.rationale,
            operations: pointer.value.operations,
            completed: ++props.progress.completed,
            metric: result.metric,
            tokenUsage: result.tokenUsage,
            created_at: new Date().toISOString(),
            step: ctx.state().analyze?.step ?? 0,
            total: props.progress.total,
          } satisfies AutoBeInterfaceAuthorizationEvent)
        : null,
    );
  });
}

function createController(props: {
  actor: AutoBeAnalyzeActor;
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "previousAnalysisFiles"
    | "databaseSchemas"
    | "previousDatabaseSchemas"
  >;
  build: (next: IAutoBeInterfaceAuthorizationApplication.IComplete) => void;
}): IAgenticaController.IClass {
  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceAuthorizationApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceAuthorizationApplication.IProps> =
      typia.validate<IAutoBeInterfaceAuthorizationApplication.IProps>(next);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = [];
    AutoBeInterfaceAuthorizationProgrammer.validateAuthorizationTypes({
      errors,
      actor: props.actor.kind,
      operations: result.data.request.operations,
      accessor: "$input.request.operations",
    });
    result.data.request.operations.forEach((operation, index) =>
      AutoBeInterfaceAuthorizationProgrammer.validateOperation({
        errors,
        actor: props.actor.kind,
        operation,
        accessor: `$input.request.operations[${index}]`,
      }),
    );
    if (errors.length !== 0) {
      return {
        success: false,
        errors,
        data: next,
      };
    }
    return result;
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfaceAuthorizationApplication>({
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
        if (next.request.type === "complete") {
          for (const o of next.request.operations)
            for (const p of o.parameters)
              AutoBeJsonSchemaFactory.fixSchema(p.schema);
          next.request.operations = next.request.operations.filter(
            (operation) =>
              AutoBeInterfaceAuthorizationProgrammer.filter({
                actor: props.actor.kind,
                operation,
              }),
          );
          props.build(next.request);
        }
      },
    } satisfies IAutoBeInterfaceAuthorizationApplication,
  };
}

const SOURCE = "interfaceAuthorization" satisfies AutoBeEventSource;
