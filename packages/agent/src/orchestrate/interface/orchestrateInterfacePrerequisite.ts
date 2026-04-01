import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeInterfacePrerequisiteEvent } from "@autobe/interface/src/events/AutoBeInterfacePrerequisiteEvent";
import { HashMap, IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { buildAnalysisContextSections } from "../../utils/RAGRetrieval";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { getEmbedder } from "../../utils/getEmbedder";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { convertToSectionEntries } from "../common/internal/convertToSectionEntries";
import { IAnalysisSectionEntry } from "../common/structures/IAnalysisSectionEntry";
import { transformInterfacePrerequisiteHistory } from "./histories/transformInterfacePrerequisiteHistory";
import { AutoBeInterfacePrerequisiteProgrammer } from "./programmers/AutoBeInterfacePrerequisiteProgrammer";
import { IAutoBeInterfacePrerequisiteApplication } from "./structures/IAutoBeInterfacePrerequisiteApplication";

export async function orchestrateInterfacePrerequisite(
  ctx: AutoBeContext,
  document: AutoBeOpenApi.IDocument,
): Promise<AutoBeInterfacePrerequisiteEvent[]> {
  const dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =
    AutoBeInterfacePrerequisiteProgrammer.associate(document.operations);
  const candidates: AutoBeOpenApi.IOperation[] = document.operations.filter(
    AutoBeInterfacePrerequisiteProgrammer.isCandidate,
  );
  const progress: AutoBeProgressEventBase = {
    total: candidates.length,
    completed: 0,
  };

  const result: Array<AutoBeInterfacePrerequisiteEvent | null> =
    await executeCachedBatch(
      ctx,
      candidates.map((it) => async (promptCacheKey) => {
        try {
          return await process(ctx, {
            dict,
            document,
            operation: it,
            progress,
            promptCacheKey,
          });
        } catch {
          return null;
        }
      }),
    );
  return result.filter((r) => r !== null);
}

async function process(
  ctx: AutoBeContext,
  props: {
    dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
    document: AutoBeOpenApi.IDocument;
    operation: AutoBeOpenApi.IOperation;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeInterfacePrerequisiteEvent | null> {
  const allSections: IAnalysisSectionEntry[] = convertToSectionEntries(
    ctx.state().analyze?.files ?? [],
  );

  const domains = Array.from(
    new Set(
      props.operation.path
        .split("/")
        .filter((p) => p && !p.startsWith(":") && !p.startsWith("{")),
    ),
  ).join(", ");

  const paths = props.operation.path;

  const queryText: string = `
    Domains: ${domains}
    Task: ${paths}
  `.trim();

  const ragSections: IAnalysisSectionEntry[] =
    await buildAnalysisContextSections(
      getEmbedder(),
      allSections,
      queryText,
      "TOPK",
      { log: false, logPrefix: "interfacePrerequisite" },
    );

  const cyclinic = new AutoBeCyclinicController<
    | "analysisSections"
    | "databaseSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
    | "previousInterfaceSchemas"
  >({
    application:
      typia.json.application<IAutoBeInterfacePrerequisiteApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "databaseSchemas",
      "interfaceOperations",
      "interfaceSchemas",
      "previousAnalysisSections",
      "previousDatabaseSchemas",
      "previousInterfaceOperations",
      "previousInterfaceSchemas",
    ],
    state: ctx.state(),
    all: {
      interfaceOperations: props.document.operations,
      interfaceSchemas: props.document.components.schemas,
    },
    local: {
      analysisSections: ragSections,
      interfaceOperations: [props.operation],
    },
  });

  const value = await cyclinic.orchestrate<
    IAutoBeInterfacePrerequisiteApplication.IWrite,
    AutoBeInterfacePrerequisiteEvent | null
  >(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeInterfacePrerequisiteApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          dict: props.dict,
          document: props.document,
          operation: props.operation,
          cyclinic,
          action,
        }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...transformInterfacePrerequisiteHistory({
          document: props.document,
          operation: props.operation,
          preliminary: context.preliminary,
        }),
      });
      return { result, action: action.value };
    },
    // VALIDATE: run business logic validation
    async (writeData) => {
      const errors: IValidation.IError[] =
        AutoBeInterfacePrerequisiteProgrammer.validate({
          dict: props.dict,
          document: props.document,
          operation: props.operation,
          complete: writeData,
        });
      if (errors.length !== 0)
        return { success: false, diagnostics: errors };
      return { success: true };
    },
    // FINALIZE: build result, dispatch event, return
    async (lastWrite, result) => {
      const event: AutoBeInterfacePrerequisiteEvent = {
        type: SOURCE,
        id: v7(),
        endpoint: {
          path: props.operation.path,
          method: props.operation.method,
        },
        analysis: lastWrite.analysis,
        rationale: lastWrite.rationale,
        prerequisites: lastWrite.prerequisites,
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
        total: props.progress.total,
        completed: ++props.progress.completed,
        step: ctx.state().database?.step ?? 0,
        created_at: new Date().toISOString(),
      };
      if (result !== null) ctx.dispatch(event);
      return event;
    },
  );
  return value;
}

function createController(props: {
  dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
  document: AutoBeOpenApi.IDocument;
  operation: AutoBeOpenApi.IOperation;
  action: IPointer<
    | {
        type: "write";
        data: IAutoBeInterfacePrerequisiteApplication.IWrite;
      }
    | { type: "complete" }
    | null
  >;
  cyclinic: AutoBeCyclinicController<
    | "analysisSections"
    | "databaseSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousInterfaceOperations"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceSchemas"
  >;
}): IAgenticaController.IClass {
  const preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousInterfaceOperations"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceSchemas"
  > = props.cyclinic.getPreliminary();

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfacePrerequisiteApplication.IProps> => {
    const result: IValidation<IAutoBeInterfacePrerequisiteApplication.IProps> =
      typia.validate<IAutoBeInterfacePrerequisiteApplication.IProps>(next);
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
      typia.llm.application<IAutoBeInterfacePrerequisiteApplication>({
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
    } satisfies IAutoBeInterfacePrerequisiteApplication,
  };
}

const SOURCE = "interfacePrerequisite" satisfies AutoBeEventSource;
