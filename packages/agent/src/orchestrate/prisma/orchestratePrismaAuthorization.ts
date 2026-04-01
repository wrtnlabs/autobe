import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyze,
  AutoBeDatabaseComponent,
  AutoBeDatabaseGroup,
  AutoBeEventSource,
} from "@autobe/interface";
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
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
): Promise<AutoBeDatabaseComponent | null> {
  const authorizationGroup: AutoBeDatabaseGroup | undefined = props.groups
    .filter((g) => g.kind === "authorization")
    .at(0);
  if (authorizationGroup === undefined) return null;

  const actors: AutoBeAnalyze.IActor[] = ctx.state().analyze?.actors ?? [];
  if (actors.length === 0) return null;

  const prefix: string | null = ctx.state().analyze?.prefix ?? null;

  return await process(ctx, {
    actors,
    prefix,
    group: authorizationGroup,
    instruction: props.instruction,
  });
}

async function process(
  ctx: AutoBeContext,
  props: {
    actors: AutoBeAnalyze.IActor[];
    prefix: string | null;
    group: AutoBeDatabaseGroup;
    instruction: string;
  },
): Promise<AutoBeDatabaseComponent> {
  const cyclinic = new AutoBeCyclinicController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >({
    application:
      typia.json.application<IAutoBeDatabaseAuthorizationApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "previousAnalysisSections",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
  });

  return cyclinic.orchestrate<
    IAutoBeDatabaseAuthorizationApplication.IWrite,
    AutoBeDatabaseComponent
  >(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeDatabaseAuthorizationApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          cyclinic,
          action,
          actors: props.actors,
          prefix: props.prefix,
        }),
        enforceFunctionCall: true,
        ...transformPrismaAuthorizationHistory({
          actors: props.actors,
          prefix: props.prefix,
          group: props.group,
          instruction: props.instruction,
          preliminary: context.preliminary,
        }),
      });
      return { result, action: action.value };
    },
    // VALIDATE: run business logic validation
    async (writeData) => {
      const errors: IValidation.IError[] = [];
      AutoBeDatabaseAuthorizationProgrammer.validate({
        errors,
        path: "$input.request.tables",
        actors: props.actors,
        prefix: props.prefix,
        tables: writeData.tables,
      });
      if (errors.length > 0)
        return { success: false, diagnostics: errors };
      return { success: true };
    },
    // FINALIZE: build result, dispatch event, return
    async (lastWrite, result) => {
      // Remove duplicated tables using shared utility
      const [component] = AutoBeDatabaseComponentProgrammer.removeDuplicatedTable(
        [
          {
            ...props.group,
            tables: lastWrite.tables,
          },
        ],
      );
      if (result !== null)
        ctx.dispatch({
          type: SOURCE,
          id: v7(),
          created_at: new Date().toISOString(),
          analysis: lastWrite.analysis,
          rationale: lastWrite.rationale,
          component,
          acquisition: cyclinic.getPreliminary().getAcquisition(),
          metric: result.metric,
          tokenUsage: result.tokenUsage,
          step: ctx.state().analyze?.step ?? 0,
        });
      return component;
    },
  );
}

function createController(props: {
  cyclinic: AutoBeCyclinicController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >;
  action: IPointer<
    | {
        type: "write";
        data: IAutoBeDatabaseAuthorizationApplication.IWrite;
      }
    | { type: "complete" }
    | null
  >;
  actors: AutoBeAnalyze.IActor[];
  prefix: string | null;
}): IAgenticaController.IClass {
  const preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  > = props.cyclinic.getPreliminary();

  const validate = (
    input: unknown,
  ): IValidation<IAutoBeDatabaseAuthorizationApplication.IProps> => {
    const result: IValidation<IAutoBeDatabaseAuthorizationApplication.IProps> =
      typia.validate<IAutoBeDatabaseAuthorizationApplication.IProps>(input);
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
      typia.llm.application<IAutoBeDatabaseAuthorizationApplication>({
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
      process: (input) => {
        if (input.request.type === "write")
          props.action.value = { type: "write", data: input.request };
        else if (input.request.type === "complete")
          props.action.value = { type: "complete" };
      },
    } satisfies IAutoBeDatabaseAuthorizationApplication,
  };
}

const SOURCE = "databaseAuthorization" satisfies AutoBeEventSource;
