import {
  AutoBeAnalyze,
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceEndpointEvent,
  AutoBeInterfaceGroup,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { HashMap, IPointer, Pair, Singleton } from "tstl";
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
import { IAutoBeInterfaceEndpointWriteApplication } from "./structures/IAutoBeInterfaceEndpointWriteApplication";

interface IProgrammer {
  kind: AutoBeInterfaceEndpointEvent["kind"];
  history(next: {
    group: AutoBeInterfaceGroup;
    preliminary: AutoBePreliminaryController<
      | "analysisSections"
      | "databaseSchemas"
      | "previousAnalysisSections"
      | "previousDatabaseSchemas"
      | "previousInterfaceOperations"
    >;
  }): IAutoBeOrchestrateHistory;
  review(next: {
    group: AutoBeInterfaceGroup;
    designs: AutoBeInterfaceEndpointDesign[];
    promptCacheKey: string;
  }): Promise<AutoBeInterfaceEndpointDesign[]>;
}

export const orchestrateInterfaceEndpointWrite = async (
  ctx: AutoBeContext,
  props: {
    programmer: IProgrammer;
    group: AutoBeInterfaceGroup;
    progress: AutoBeProgressEventBase;
    counter: Singleton<number>;
    promptCacheKey: string;
  },
): Promise<AutoBeInterfaceEndpointDesign[]> => {
  const start: Date = new Date();

  const allSections: IAnalysisSectionEntry[] = convertToSectionEntries(
    ctx.state().analyze?.files ?? [],
  );
  const queryText: string = [
    "interface",
    "endpoint",
    props.group.name,
    ...props.group.databaseSchemas,
  ].join(" ");

  const ragSections: IAnalysisSectionEntry[] =
    await buildAnalysisContextSections(
      getEmbedder(),
      allSections,
      queryText,
      "TOPK",
      { log: false, logPrefix: "interfaceEndpointWrite" },
    );

  const databaseSchemas: Map<string, AutoBeDatabase.IModel> = new Map(
    ctx
      .state()
      .database!.result.data.files.flatMap((f) => f.models)
      .map((m) => [m.name, m]),
  );
  const preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  > = new AutoBePreliminaryController({
    dispatch: (e) => ctx.dispatch(e),
    state: ctx.state(),
    application:
      typia.json.application<IAutoBeInterfaceEndpointWriteApplication>(),
    kinds: [
      "analysisSections",
      "databaseSchemas",
      "previousAnalysisSections",
      "previousDatabaseSchemas",
      "previousInterfaceOperations",
    ],
    source: SOURCE,
    local: {
      analysisSections: ragSections,
      databaseSchemas: props.group.databaseSchemas
        .map((key) => databaseSchemas.get(key))
        .filter((m) => m !== undefined),
    },
  });
  const event: AutoBeInterfaceEndpointEvent = await preliminary.orchestrate(
    ctx,
    async (out) => {
      const pointer: IPointer<IAutoBeInterfaceEndpointWriteApplication.IWrite | null> =
        {
          value: null,
        };
      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          actors: ctx.state().analyze?.actors ?? [],
          preliminary,
          build: (next) => {
            pointer.value = next;
          },
        }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...props.programmer.history({
          group: props.group,
          preliminary,
        }),
      });
      if (pointer.value === null) return out(result)(null);

      const actors: AutoBeAnalyze.IActor[] = ctx.state().analyze?.actors ?? [];
      const designs: AutoBeInterfaceEndpointDesign[] = new HashMap(
        pointer.value.designs.map((c) => new Pair(c.endpoint, c)),
        AutoBeOpenApiEndpointComparator.hashCode,
        AutoBeOpenApiEndpointComparator.equals,
      )
        .toJSON()
        .map((it) =>
          AutoBeInterfaceEndpointProgrammer.fixDesign({
            actors,
            design: it.second,
          }),
        )
        .filter((design) =>
          AutoBeInterfaceEndpointProgrammer.filter({
            kind: props.programmer.kind,
            design,
            actors,
          }),
        );
      return out(result)({
        id: v7(),
        type: SOURCE,
        kind: props.programmer.kind,
        group: props.group.name,
        analysis: pointer.value.analysis,
        rationale: pointer.value.rationale,
        designs,
        acquisition: preliminary.getAcquisition(),
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        created_at: start.toISOString(),
        step: ctx.state().analyze?.step ?? 0,
        completed: props.counter.get(),
        total: props.progress.total,
      } satisfies AutoBeInterfaceEndpointEvent);
    },
  );
  ctx.dispatch(event);
  return event.designs;
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
  build: (next: IAutoBeInterfaceEndpointWriteApplication.IWrite) => void;
}): ILlmController => {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeInterfaceEndpointWriteApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceEndpointWriteApplication.IProps> =
      typia.validate<IAutoBeInterfaceEndpointWriteApplication.IProps>(input);
    if (result.success === false) return result;
    else if (result.data.request.type !== "write")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const designs: AutoBeInterfaceEndpointDesign[] =
      result.data.request.designs;
    const errors: IValidation.IError[] = [];

    designs.forEach((d, i) => {
      AutoBeInterfaceEndpointProgrammer.validateDesign({
        actors: props.actors,
        design: d,
        errors,
        path: `$input.request.designs[${i}]`,
      });
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
    typia.llm.application<IAutoBeInterfaceEndpointWriteApplication>({
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
    } satisfies IAutoBeInterfaceEndpointWriteApplication,
  };
};

const SOURCE = "interfaceEndpoint" satisfies AutoBeEventSource;
