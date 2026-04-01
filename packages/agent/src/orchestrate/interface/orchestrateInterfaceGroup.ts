import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabaseHistory,
  AutoBeEventSource,
  AutoBeInterfaceGroupEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceGroupHistory } from "./histories/transformInterfaceGroupHistory";
import { IAutoBeInterfaceGroupApplication } from "./structures/IAutoBeInterfaceGroupApplication";

export async function orchestrateInterfaceGroup(
  ctx: AutoBeContext,
  props: {
    instruction: string;
  },
): Promise<AutoBeInterfaceGroupEvent> {
  const start: Date = new Date();
  const prisma: AutoBeDatabaseHistory | null = ctx.state().database;

  const cyclinic = new AutoBeCyclinicController<
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  >({
    application: typia.json.application<IAutoBeInterfaceGroupApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "databaseSchemas",
      "previousAnalysisSections",
      "previousDatabaseSchemas",
      "previousInterfaceOperations",
    ],
    state: ctx.state(),
  });

  return cyclinic.orchestrate<
    IAutoBeInterfaceGroupApplication.IWrite,
    AutoBeInterfaceGroupEvent
  >(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeInterfaceGroupApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          action,
          cyclinic,
          databaseSchemas: new Set(
            prisma !== null
              ? prisma.result.data.files
                  .map((f) => f.models)
                  .flat()
                  .map((m) => m.name)
              : [],
          ),
        }),
        enforceFunctionCall: true,
        ...transformInterfaceGroupHistory({
          state: ctx.state(),
          instruction: props.instruction,
          preliminary: context.preliminary,
        }),
      });
      return { result, action: action.value };
    },
    // VALIDATE: run business logic validation
    async (_writeData) => {
      return { success: true };
    },
    // FINALIZE: build result, dispatch event, return
    async (lastWrite, result) => {
      const event: AutoBeInterfaceGroupEvent = {
        type: SOURCE,
        id: v7(),
        analysis: lastWrite.analysis,
        rationale: lastWrite.rationale,
        created_at: start.toISOString(),
        groups: lastWrite.groups,
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
        step: ctx.state().analyze?.step ?? 0,
      };
      if (result !== null) ctx.dispatch(event);
      return event;
    },
  );
}

function createController(props: {
  action: IPointer<
    | {
        type: "write";
        data: IAutoBeInterfaceGroupApplication.IWrite;
      }
    | { type: "complete" }
    | null
  >;
  cyclinic: AutoBeCyclinicController<
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  >;
  databaseSchemas: Set<string>;
}): IAgenticaController.IClass {
  const preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  > = props.cyclinic.getPreliminary();

  const validate = (
    input: unknown,
  ): IValidation<IAutoBeInterfaceGroupApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceGroupApplication.IProps> =
      typia.validate<IAutoBeInterfaceGroupApplication.IProps>(input);
    if (result.success === false) return result;

    const req = result.data.request;
    if (req.type === "complete") return result;
    if (req.type !== "write")
      return preliminary.validate({
        thinking: result.data.thinking,
        request: req,
      });

    // Complete request validation - check databaseSchemas
    const errors: IValidation.IError[] = [];
    req.groups.forEach((group, i) => {
      group.databaseSchemas.forEach((key, j) => {
        if (props.databaseSchemas.has(key) === false)
          errors.push({
            expected: Array.from(props.databaseSchemas)
              .map((s) => JSON.stringify(s))
              .join(" | "),
            value: key,
            path: `request.groups[${i}].databaseSchemas[${j}]`,
            description: StringUtil.trim`
              The database schema "${key}" does not exist in the current project.

              Make sure to provide only the valid database schema names that are present in your project.

              Here is the list of available database schemas in the project:

              ${Array.from(props.databaseSchemas)
                .map((s) => `- ${s}`)
                .join("\n")}
            `,
          });
      });
    });
    return errors.length === 0
      ? result
      : {
          success: false,
          data: result.data,
          errors,
        };
  };

  const application: ILlmApplication = props.cyclinic.fixCompleteAvailability(
    preliminary.fixApplication(
      typia.llm.application<IAutoBeInterfaceGroupApplication>({
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
    } satisfies IAutoBeInterfaceGroupApplication,
  };
}

const SOURCE = "interfaceGroup" satisfies AutoBeEventSource;
