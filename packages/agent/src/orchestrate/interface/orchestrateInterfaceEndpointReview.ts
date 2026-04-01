import {
  AutoBeAnalyze,
  AutoBeEventSource,
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceEndpointReviewEvent,
  AutoBeInterfaceGroup,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { IPointer } from "tstl";
import typia, { ILlmApplication, ILlmController, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../structures/IAutoBeOrchestrateHistory";
import { buildAnalysisContextSections } from "../../utils/RAGRetrieval";
import { getEmbedder } from "../../utils/getEmbedder";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { convertToSectionEntries } from "../common/internal/convertToSectionEntries";
import { IAnalysisSectionEntry } from "../common/structures/IAnalysisSectionEntry";
import { AutoBeInterfaceEndpointProgrammer } from "./programmers/AutoBeInterfaceEndpointProgrammer";
import { AutoBeInterfaceEndpointReviewProgrammer } from "./programmers/AutoBeInterfaceEndpointReviewProgrammer";
import { IAutoBeInterfaceEndpointReviewApplication } from "./structures/IAutoBeInterfaceEndpointReviewApplication";

interface IProgrammer {
  kind: AutoBeInterfaceEndpointReviewEvent["kind"];
  history(next: {
    preliminary: AutoBePreliminaryController<
      | "analysisSections"
      | "databaseSchemas"
      | "previousAnalysisSections"
      | "previousDatabaseSchemas"
      | "previousInterfaceOperations"
    >;
    group: AutoBeInterfaceGroup;
    designs: AutoBeInterfaceEndpointDesign[];
  }): IAutoBeOrchestrateHistory;
}

export const orchestrateInterfaceEndpointReview = async (
  ctx: AutoBeContext,
  props: {
    programmer: IProgrammer;
    group: AutoBeInterfaceGroup;
    designs: AutoBeInterfaceEndpointDesign[];
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeInterfaceEndpointDesign[]> => {
  const allSections: IAnalysisSectionEntry[] = convertToSectionEntries(
    ctx.state().analyze?.files ?? [],
  );
  const queryText: string = [
    "interface",
    "endpoint",
    "review",
    props.group.name,
    ...props.group.databaseSchemas,
    ...props.designs.map((d) => `${d.endpoint.method} ${d.endpoint.path}`),
  ].join(" ");

  const ragSections: IAnalysisSectionEntry[] =
    await buildAnalysisContextSections(
      getEmbedder(),
      allSections,
      queryText,
      "TOPK",
      { log: false, logPrefix: "interfaceEndpointReview" },
    );

  const cyclinic = new AutoBeCyclinicController<
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  >({
    application:
      typia.json.application<IAutoBeInterfaceEndpointReviewApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "databaseSchemas",
      "previousAnalysisSections",
      "previousDatabaseSchemas",
      "previousInterfaceOperations",
    ],
    state: ctx.state(),
    local: {
      analysisSections: ragSections,
      databaseSchemas:
        ctx
          .state()
          .database?.result.data.files.map((f) => f.models)
          .flat() ?? [],
    },
  });

  return cyclinic.orchestrate<
    IAutoBeInterfaceEndpointReviewApplication.IWrite,
    AutoBeInterfaceEndpointDesign[]
  >(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeInterfaceEndpointReviewApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          actors: ctx.state().analyze?.actors ?? [],
          designs: props.designs,
          cyclinic,
          action,
        }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...props.programmer.history({
          group: props.group,
          designs: props.designs,
          preliminary: context.preliminary,
        }),
      });
      return { result, action: action.value };
    },
    // VALIDATE: run business logic validation
    async (writeData) => {
      const errors: IValidation.IError[] = [];
      AutoBeInterfaceEndpointReviewProgrammer.validate({
        path: "$input.request.revises",
        errors,
        actors: ctx.state().analyze?.actors ?? [],
        revises: writeData.revises,
        designs: props.designs,
      });
      if (errors.length !== 0)
        return { success: false, diagnostics: errors };
      return { success: true };
    },
    // FINALIZE: build result, dispatch event, return
    async (lastWrite, result) => {
      if (result !== null)
        ctx.dispatch({
          id: v7(),
          type: SOURCE,
          kind: props.programmer.kind,
          group: props.group.name,
          designs: props.designs,
          review: lastWrite.review,
          revises: lastWrite.revises,
          acquisition: cyclinic.getPreliminary().getAcquisition(),
          created_at: new Date().toISOString(),
          step: ctx.state().analyze?.step ?? 0,
          completed: ++props.progress.completed,
          total: props.progress.total,
          metric: result.metric,
          tokenUsage: result.tokenUsage,
        } satisfies AutoBeInterfaceEndpointReviewEvent);
      return AutoBeInterfaceEndpointReviewProgrammer.execute({
        kind: props.programmer.kind,
        actors: ctx.state().analyze?.actors ?? [],
        designs: props.designs,
        revises: lastWrite.revises,
      });
    },
  );
};

const createController = (props: {
  actors: AutoBeAnalyze.IActor[];
  cyclinic: AutoBeCyclinicController<
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  >;
  designs: AutoBeInterfaceEndpointDesign[];
  action: IPointer<
    | {
        type: "write";
        data: IAutoBeInterfaceEndpointReviewApplication.IWrite;
      }
    | { type: "complete" }
    | null
  >;
}): ILlmController => {
  const preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  > = props.cyclinic.getPreliminary();

  const validate = (
    input: unknown,
  ): IValidation<IAutoBeInterfaceEndpointReviewApplication.IProps> => {
    const result =
      typia.validate<IAutoBeInterfaceEndpointReviewApplication.IProps>(input);
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
      typia.llm.application<IAutoBeInterfaceEndpointReviewApplication>({
        validate: {
          process: validate,
        },
      }),
    ),
  );
  AutoBeInterfaceEndpointProgrammer.fixApplication({
    application,
    actors: props.actors,
  });

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
    } satisfies IAutoBeInterfaceEndpointReviewApplication,
  };
};

const SOURCE = "interfaceEndpointReview" satisfies AutoBeEventSource;
