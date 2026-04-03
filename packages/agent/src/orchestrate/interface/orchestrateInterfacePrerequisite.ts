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
  const preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
    | "previousInterfaceSchemas"
  > = new AutoBePreliminaryController({
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
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeInterfacePrerequisiteApplication.IWrite | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        dict: props.dict,
        document: props.document,
        operation: props.operation,
        preliminary,
        build: (next) => {
          pointer.value = next;
        },
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformInterfacePrerequisiteHistory({
        document: props.document,
        operation: props.operation,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const event: AutoBeInterfacePrerequisiteEvent = {
      type: SOURCE,
      id: v7(),
      endpoint: {
        path: props.operation.path,
        method: props.operation.method,
      },
      analysis: pointer.value.analysis,
      rationale: pointer.value.rationale,
      prerequisites: pointer.value.prerequisites,
      acquisition: preliminary.getAcquisition(),
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      total: props.progress.total,
      completed: ++props.progress.completed,
      step: ctx.state().database?.step ?? 0,
      created_at: new Date().toISOString(),
    };
    ctx.dispatch(event);
    return out(result)(event);
  });
}

function createController(props: {
  dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
  document: AutoBeOpenApi.IDocument;
  operation: AutoBeOpenApi.IOperation;
  preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousInterfaceOperations"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceSchemas"
  >;
  build: (next: IAutoBeInterfacePrerequisiteApplication.IWrite) => void;
}): IAgenticaController.IClass {
  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfacePrerequisiteApplication.IProps> => {
    const result: IValidation<IAutoBeInterfacePrerequisiteApplication.IProps> =
      typia.validate<IAutoBeInterfacePrerequisiteApplication.IProps>(next);
    if (result.success === false) return result;
    else if (result.data.request.type !== "write")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] =
      AutoBeInterfacePrerequisiteProgrammer.validate({
        dict: props.dict,
        document: props.document,
        operation: props.operation,
        complete: result.data.request,
      });
    return errors.length === 0
      ? result
      : {
          success: false,
          errors,
          data: result.data,
        };
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfacePrerequisiteApplication>({
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
        if (next.request.type === "write") props.build(next.request);
      },
    } satisfies IAutoBeInterfacePrerequisiteApplication,
  };
}

const SOURCE = "interfacePrerequisite" satisfies AutoBeEventSource;
