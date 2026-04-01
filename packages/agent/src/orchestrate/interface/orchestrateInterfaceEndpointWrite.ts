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
import { HashMap, IPointer, Pair } from "tstl";
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

  const cyclinic = new AutoBeCyclinicController<
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  >({
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
    state: ctx.state(),
    local: {
      analysisSections: ragSections,
      databaseSchemas: props.group.databaseSchemas
        .map((key) => databaseSchemas.get(key))
        .filter((m) => m !== undefined),
    },
  });

  return cyclinic.orchestrate<
    IAutoBeInterfaceEndpointWriteApplication.IWrite,
    AutoBeInterfaceEndpointDesign[]
  >(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeInterfaceEndpointWriteApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          actors: ctx.state().analyze?.actors ?? [],
          cyclinic,
          action,
        }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...props.programmer.history({
          group: props.group,
          preliminary: context.preliminary,
        }),
      });
      return { result, action: action.value };
    },
    // VALIDATE: run business logic validation
    async (writeData) => {
      const actors: AutoBeAnalyze.IActor[] = ctx.state().analyze?.actors ?? [];
      const errors: IValidation.IError[] = [];
      writeData.designs.forEach((d, i) => {
        AutoBeInterfaceEndpointProgrammer.validateDesign({
          actors,
          design: d,
          errors,
          path: `$input.request.designs[${i}]`,
        });
      });
      if (errors.length !== 0) return { success: false, diagnostics: errors };
      return { success: true };
    },
    // FINALIZE: build result, dispatch event, return
    async (lastWrite, result) => {
      const actors: AutoBeAnalyze.IActor[] = ctx.state().analyze?.actors ?? [];
      const designs: AutoBeInterfaceEndpointDesign[] = new HashMap(
        lastWrite.designs.map((c) => new Pair(c.endpoint, c)),
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

      if (result !== null)
        ctx.dispatch({
          id: v7(),
          type: SOURCE,
          kind: props.programmer.kind,
          group: props.group.name,
          analysis: lastWrite.analysis,
          rationale: lastWrite.rationale,
          designs,
          acquisition: cyclinic.getPreliminary().getAcquisition(),
          metric: result.metric,
          tokenUsage: result.tokenUsage,
          created_at: start.toISOString(),
          step: ctx.state().analyze?.step ?? 0,
          completed: ++props.progress.completed,
          total: props.progress.total,
        } satisfies AutoBeInterfaceEndpointEvent);
      return designs;
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
  action: IPointer<
    | {
        type: "write";
        data: IAutoBeInterfaceEndpointWriteApplication.IWrite;
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
  ): IValidation<IAutoBeInterfaceEndpointWriteApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceEndpointWriteApplication.IProps> =
      typia.validate<IAutoBeInterfaceEndpointWriteApplication.IProps>(input);
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
      typia.llm.application<IAutoBeInterfaceEndpointWriteApplication>({
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
    } satisfies IAutoBeInterfaceEndpointWriteApplication,
  };
};

const SOURCE = "interfaceEndpoint" satisfies AutoBeEventSource;
