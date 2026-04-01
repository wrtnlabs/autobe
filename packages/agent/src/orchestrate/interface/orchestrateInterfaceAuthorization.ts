import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyze,
  AutoBeEventSource,
  AutoBeInterfaceAuthorization,
  AutoBeInterfaceAuthorizationEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { NamingConvention } from "@typia/utils";
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
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
  const actors: AutoBeAnalyze.IActor[] = ctx.state().analyze?.actors ?? [];
  const progress: AutoBeProgressEventBase = {
    total: actors.length,
    completed: 0,
  };
  return await executeCachedBatch(
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
}

async function process(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    actor: AutoBeAnalyze.IActor;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeInterfaceAuthorizationEvent> {
  const prefix: string = NamingConvention.camel(ctx.state().analyze!.prefix);

  const cyclinic = new AutoBeCyclinicController<
    | "analysisSections"
    | "previousAnalysisSections"
    | "databaseSchemas"
    | "previousDatabaseSchemas"
  >({
    application:
      typia.json.application<IAutoBeInterfaceAuthorizationApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "previousAnalysisSections",
      "databaseSchemas",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
  });

  return cyclinic.orchestrate<
    IAutoBeInterfaceAuthorizationApplication.IWrite,
    AutoBeInterfaceAuthorizationEvent
  >(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeInterfaceAuthorizationApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          actor: props.actor,
          action,
          cyclinic,
          prefix,
        }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...transformInterfaceAuthorizationHistory({
          state: ctx.state(),
          prefix,
          instruction: props.instruction,
          actor: props.actor,
          preliminary: context.preliminary,
        }),
      });
      return { result, action: action.value };
    },
    // VALIDATE: run business logic validation
    async (writeData) => {
      const errors: IValidation.IError[] = [];
      AutoBeInterfaceAuthorizationProgrammer.validateAuthorizationTypes({
        errors,
        actor: props.actor,
        operations: writeData.operations,
        accessor: "$input.request.operations",
      });
      writeData.operations.forEach((operation, index) =>
        AutoBeInterfaceAuthorizationProgrammer.validateOperation({
          errors,
          prefix,
          actor: props.actor,
          operation,
          accessor: `$input.request.operations[${index}]`,
        }),
      );
      if (errors.length !== 0)
        return { success: false, diagnostics: errors };
      return { success: true };
    },
    // FINALIZE: build result, dispatch event, return
    async (lastWrite, result) => {
      // Apply fixes from execute.process logic
      for (const o of lastWrite.operations)
        for (const p of o.parameters)
          AutoBeJsonSchemaFactory.fixSchema(p.schema);
      const filteredOperations: AutoBeOpenApi.IOperation[] =
        lastWrite.operations.filter((operation) =>
          AutoBeInterfaceAuthorizationProgrammer.filter({
            actor: props.actor.kind,
            operation,
          }),
        );
      const operations: AutoBeOpenApi.IOperation[] =
        AutoBeInterfaceAuthorizationProgrammer.fixOperations({
          operations: filteredOperations,
          prefix,
        });

      const event: AutoBeInterfaceAuthorizationEvent = {
        type: SOURCE,
        id: v7(),
        analysis: lastWrite.analysis,
        rationale: lastWrite.rationale,
        operations,
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
        created_at: new Date().toISOString(),
        step: ctx.state().analyze?.step ?? 0,
        total: props.progress.total,
        completed: ++props.progress.completed,
      };
      return event;
    },
  );
}

function createController(props: {
  prefix: string | null;
  actor: AutoBeAnalyze.IActor;
  action: IPointer<
    | {
        type: "write";
        data: IAutoBeInterfaceAuthorizationApplication.IWrite;
      }
    | { type: "complete" }
    | null
  >;
  cyclinic: AutoBeCyclinicController<
    | "analysisSections"
    | "previousAnalysisSections"
    | "databaseSchemas"
    | "previousDatabaseSchemas"
  >;
}): IAgenticaController.IClass {
  const preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "previousAnalysisSections"
    | "databaseSchemas"
    | "previousDatabaseSchemas"
  > = props.cyclinic.getPreliminary();

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceAuthorizationApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceAuthorizationApplication.IProps> =
      typia.validate<IAutoBeInterfaceAuthorizationApplication.IProps>(next);
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
      typia.llm.application<IAutoBeInterfaceAuthorizationApplication>({
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
    } satisfies IAutoBeInterfaceAuthorizationApplication,
  };
}

const SOURCE = "interfaceAuthorization" satisfies AutoBeEventSource;
