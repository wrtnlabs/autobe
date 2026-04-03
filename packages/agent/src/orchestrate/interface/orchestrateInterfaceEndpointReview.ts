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

  const pointer: IPointer<IAutoBeInterfaceEndpointReviewApplication.IWrite | null> =
    { value: null };
  const preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  > = new AutoBePreliminaryController({
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
  return await preliminary.orchestrate(ctx, async (out) => {
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        actors: ctx.state().analyze?.actors ?? [],
        designs: props.designs,
        preliminary,
        build: (next) => {
          pointer.value = next;
        },
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...props.programmer.history({
        group: props.group,
        designs: props.designs,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    ctx.dispatch({
      id: v7(),
      type: SOURCE,
      kind: props.programmer.kind,
      group: props.group.name,
      designs: props.designs,
      review: pointer.value.review,
      revises: pointer.value.revises,
      acquisition: preliminary.getAcquisition(),
      created_at: new Date().toISOString(),
      step: ctx.state().analyze?.step ?? 0,
      completed: ++props.progress.completed,
      total: props.progress.total,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
    } satisfies AutoBeInterfaceEndpointReviewEvent);
    return out(result)(
      AutoBeInterfaceEndpointReviewProgrammer.execute({
        kind: props.programmer.kind,
        actors: ctx.state().analyze?.actors ?? [],
        designs: props.designs,
        revises: pointer.value.revises,
      }),
    );
  });
};

const createController = (props: {
  actors: AutoBeAnalyze.IActor[];
  preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  >;
  designs: AutoBeInterfaceEndpointDesign[];
  build: (next: IAutoBeInterfaceEndpointReviewApplication.IWrite) => void;
}): ILlmController => {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeInterfaceEndpointReviewApplication.IProps> => {
    const result =
      typia.validate<IAutoBeInterfaceEndpointReviewApplication.IProps>(input);
    if (result.success === false) return result;
    else if (result.data.request.type !== "write")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = [];
    AutoBeInterfaceEndpointReviewProgrammer.validate({
      path: "$input.request.revises",
      errors,
      actors: props.actors,
      revises: result.data.request.revises,
      designs: props.designs,
    });
    if (errors.length !== 0)
      return {
        success: false,
        errors,
        data: input,
      };
    return result;
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfaceEndpointReviewApplication>({
      validate: {
        process: validate,
      },
    }),
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
        if (next.request.type === "write") props.build(next.request);
      },
    } satisfies IAutoBeInterfaceEndpointReviewApplication,
  };
};

const SOURCE = "interfaceEndpointReview" satisfies AutoBeEventSource;
