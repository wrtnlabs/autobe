import {
  AutoBeEventSource,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeCollectorPlan,
  AutoBeRealizePlanEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { IPointer } from "tstl";
import typia, { ILlmApplication, ILlmController, IValidation } from "typia";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { buildAnalysisContextSections } from "../../utils/RAGRetrieval";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { getEmbedder } from "../../utils/getEmbedder";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { convertToSectionEntries } from "../common/internal/convertToSectionEntries";
import { IAnalysisSectionEntry } from "../common/structures/IAnalysisSectionEntry";
import { transformRealizeCollectorPlanHistory } from "./histories/transformRealizeCollectorPlanHistory";
import { AutoBeRealizeCollectorProgrammer } from "./programmers/AutoBeRealizeCollectorProgrammer";
import { IAutoBeRealizeCollectorPlanApplication } from "./structures/IAutoBeRealizeCollectorPlanApplication";

export async function orchestrateRealizeCollectorPlan(
  ctx: AutoBeContext,
  props: {
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCollectorPlan[]> {
  const history: AutoBeInterfaceHistory | null = ctx.state().interface;
  if (history === null)
    throw new Error("Cannot realize collector plan without interface.");

  const document: AutoBeOpenApi.IDocument = history.document;
  const dtoTypeNames: string[] = Object.keys(
    document.components.schemas,
  ).filter(AutoBeRealizeCollectorProgrammer.filter);
  const prismaSchemaNames: Set<string> = new Set(
    ctx
      .state()
      .database!.result.data.files.map((f) => f.models)
      .flat()
      .map((m) => m.name),
  );

  const result: AutoBeRealizeCollectorPlan[][] = await executeCachedBatch(
    ctx,
    Array.from(dtoTypeNames).map(
      (it) => (promptCacheKey) =>
        forceRetry(() =>
          process(ctx, {
            document,
            dtoTypeName: it,
            prismaSchemaNames,
            promptCacheKey,
            progress: props.progress,
          }),
        ),
    ),
  );
  return result.flat();
}

async function process(
  ctx: AutoBeContext,
  props: {
    document: AutoBeOpenApi.IDocument;
    dtoTypeName: string;
    prismaSchemaNames: Set<string>;
    promptCacheKey: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCollectorPlan[]> {
  const allSections: IAnalysisSectionEntry[] = convertToSectionEntries(
    ctx.state().analyze?.files ?? [],
  );

  const queryText: string = [
    "collector",
    "plan",
    "dto",
    "prisma",
    props.dtoTypeName,
  ].join(" ");

  const ragSections: IAnalysisSectionEntry[] =
    await buildAnalysisContextSections(
      getEmbedder(),
      allSections,
      queryText,
      "TOPK",
      { log: false, logPrefix: "realizeCollectorPlan" },
    );

  let previousWrite: IAutoBeRealizeCollectorPlanApplication.IWrite | null =
    null;

  const cyclinic = new AutoBeCyclinicController<
    | "analysisSections"
    | "databaseSchemas"
    | "interfaceSchemas"
    | "interfaceOperations"
  >({
    state: ctx.state(),
    source: SOURCE,
    application:
      typia.json.application<IAutoBeRealizeCollectorPlanApplication>(),
    kinds: [
      "analysisSections",
      "databaseSchemas",
      "interfaceSchemas",
      "interfaceOperations",
    ],
    local: {
      analysisSections: ragSections,
      interfaceOperations: props.document.operations.filter(
        (op) => op.requestBody?.typeName === props.dtoTypeName,
      ),
      interfaceSchemas: Object.fromEntries(
        Object.entries(props.document.components.schemas).filter(
          ([key]) => key === props.dtoTypeName,
        ),
      ),
    },
  });

  return cyclinic.orchestrate(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeRealizeCollectorPlanApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          prismaSchemaNames: props.prismaSchemaNames,
          dtoTypeName: props.dtoTypeName,
          cyclinic,
          action,
        }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...transformRealizeCollectorPlanHistory({
          state: ctx.state(),
          preliminary: context.preliminary,
          dtoTypeName: props.dtoTypeName,
          previousWrite,
          failures: context.failures,
        }),
      });

      return { result, action: action.value };
    },
    // VALIDATE: check dtoTypeName match and prismaSchemaNames validity
    async (writeData) => {
      previousWrite = writeData;
      const errors: IValidation.IError[] = [];
      writeData.plans.forEach((plan, i) => {
        if (props.dtoTypeName !== plan.dtoTypeName)
          errors.push({
            path: `$input.request.plans[${i}].dtoTypeName`,
            value: plan.dtoTypeName,
            expected: JSON.stringify(props.dtoTypeName),
            description: StringUtil.trim`
              The DTO type name must be ${JSON.stringify(props.dtoTypeName)}.

              If you have planned other DTO type's collector,
              please entirely remake the plan with ONLY the DTO type
              ${JSON.stringify(props.dtoTypeName)}.
            `,
          });
        if (
          plan.databaseSchemaName !== null &&
          props.prismaSchemaNames.has(plan.databaseSchemaName) === false
        )
          errors.push({
            path: `$input.request.plans[${i}].databaseSchemaName`,
            value: plan.databaseSchemaName,
            expected: Array.from(props.prismaSchemaNames)
              .map((s) => JSON.stringify(s))
              .join(" | "),
            description: StringUtil.trim`
              The database schema name must be one of the available database schemas.

              ${Array.from(props.prismaSchemaNames)
                .map((s) => `- ${s}`)
                .join("\n")}
            `,
          });
      });
      return errors.length
        ? { success: false, diagnostics: errors }
        : { success: true };
    },
    // FINALIZE: build plans, dispatch event, return
    async (lastWrite, result) => {
      const plans: AutoBeRealizeCollectorPlan[] = lastWrite.plans
        .filter((p) => p.databaseSchemaName !== null)
        .map((p) => ({
          type: "collector" as const,
          dtoTypeName: p.dtoTypeName,
          thinking: p.thinking,
          databaseSchemaName: p.databaseSchemaName!,
          references: p.references,
        }));

      if (result !== null) {
        const event: AutoBeRealizePlanEvent = {
          type: "realizePlan",
          id: v4(),
          plans,
          acquisition: cyclinic.getPreliminary().getAcquisition(),
          metric: result.metric,
          tokenUsage: result.tokenUsage,
          completed: ++props.progress.completed,
          total: props.progress.total,
          step: ctx.state().analyze?.step ?? 0,
          created_at: new Date().toISOString(),
        };
        ctx.dispatch(event);
      }
      return plans;
    },
  );
}

function createController(props: {
  prismaSchemaNames: Set<string>;
  dtoTypeName: string;
  cyclinic: AutoBeCyclinicController<
    | "analysisSections"
    | "databaseSchemas"
    | "interfaceSchemas"
    | "interfaceOperations"
  >;
  action: IPointer<
    | {
        type: "write";
        data: IAutoBeRealizeCollectorPlanApplication.IWrite;
      }
    | { type: "complete" }
    | null
  >;
}): ILlmController {
  const preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "interfaceSchemas"
    | "interfaceOperations"
  > = props.cyclinic.getPreliminary();
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeCollectorPlanApplication.IProps> =
      typia.validate<IAutoBeRealizeCollectorPlanApplication.IProps>(input);
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
      typia.llm.application<IAutoBeRealizeCollectorPlanApplication>({
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
    } satisfies IAutoBeRealizeCollectorPlanApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeCollectorPlanApplication.IProps>;

const SOURCE = "realizePlan" satisfies AutoBeEventSource;
