import { IAgenticaController } from "@agentica/core";
import { AutoBeDatabaseGroup, AutoBeEventSource } from "@autobe/interface";
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaGroupHistory } from "./histories/transformPrismaGroupHistory";
import { AutoBeDatabaseGroupProgrammer } from "./programmers/AutoBeDatabaseGroupProgrammer";
import { IAutoBeDatabaseGroupApplication } from "./structures/IAutoBeDatabaseGroupApplication";

export async function orchestratePrismaGroup(
  ctx: AutoBeContext,
  instruction: string,
): Promise<AutoBeDatabaseGroup[]> {
  const start: Date = new Date();

  const cyclinic = new AutoBeCyclinicController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >({
    application: typia.json.application<IAutoBeDatabaseGroupApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "previousAnalysisSections",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
  });

  return cyclinic.orchestrate<
    IAutoBeDatabaseGroupApplication.IWrite,
    AutoBeDatabaseGroup[]
  >(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeDatabaseGroupApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          action,
          cyclinic,
        }),
        enforceFunctionCall: true,
        ...transformPrismaGroupHistory(ctx.state(), {
          instruction,
          preliminary: context.preliminary,
        }),
      });
      return { result, action: action.value };
    },
    // VALIDATE: run business logic validation
    async (writeData) => {
      const errors: IValidation.IError[] = [];
      AutoBeDatabaseGroupProgrammer.validate({
        errors,
        path: "$input.request.groups",
        groups: writeData.groups,
      });
      if (errors.length > 0) return { success: false, diagnostics: errors };
      return { success: true };
    },
    // FINALIZE: build result, dispatch event, return
    async (lastWrite, result) => {
      if (result !== null)
        ctx.dispatch({
          type: SOURCE,
          id: v7(),
          created_at: start.toISOString(),
          analysis: lastWrite.analysis,
          rationale: lastWrite.rationale,
          groups: lastWrite.groups,
          acquisition: cyclinic.getPreliminary().getAcquisition(),
          metric: result.metric,
          tokenUsage: result.tokenUsage,
          step: ctx.state().analyze?.step ?? 0,
        });
      return lastWrite.groups;
    },
  );
}

function createController(props: {
  action: IPointer<
    | {
        type: "write";
        data: IAutoBeDatabaseGroupApplication.IWrite;
      }
    | { type: "complete" }
    | null
  >;
  cyclinic: AutoBeCyclinicController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >;
}): IAgenticaController.IClass {
  const preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  > = props.cyclinic.getPreliminary();

  const validate = (
    input: unknown,
  ): IValidation<IAutoBeDatabaseGroupApplication.IProps> => {
    const result: IValidation<IAutoBeDatabaseGroupApplication.IProps> =
      typia.validate<IAutoBeDatabaseGroupApplication.IProps>(input);
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
      typia.llm.application<IAutoBeDatabaseGroupApplication>({
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
    } satisfies IAutoBeDatabaseGroupApplication,
  };
}

const SOURCE = "databaseGroup" satisfies AutoBeEventSource;
