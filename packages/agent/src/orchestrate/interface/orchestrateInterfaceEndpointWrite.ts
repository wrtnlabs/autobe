import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceEndpointEvent,
  AutoBeInterfaceEndpointRevise,
  AutoBeInterfaceGroup,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { ILlmApplication, ILlmController, IValidation } from "@samchon/openapi";
import { HashMap, IPointer, Pair } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { IAutoBeInterfaceEndpointWriteApplication } from "./structures/IAutoBeInterfaceEndpointWriteApplication";

interface IProgrammer {
  kind: AutoBeInterfaceEndpointEvent["kind"];
  history(next: {
    group: AutoBeInterfaceGroup;
    preliminary: AutoBePreliminaryController<
      | "analysisFiles"
      | "databaseSchemas"
      | "previousAnalysisFiles"
      | "previousDatabaseSchemas"
      | "previousInterfaceOperations"
    >;
  }): IAutoBeOrchestrateHistory;
  review(next: {
    group: AutoBeInterfaceGroup;
    designs: AutoBeInterfaceEndpointDesign[];
    promptCacheKey: string;
  }): Promise<AutoBeInterfaceEndpointRevise[]>;
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
  const databaseSchemas: Map<string, AutoBeDatabase.IModel> = new Map(
    ctx
      .state()
      .database!.result.data.files.flatMap((f) => f.models)
      .map((m) => [m.name, m]),
  );
  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceEndpointWriteApplication>(),
    kinds: [
      "analysisFiles",
      "databaseSchemas",
      "previousAnalysisFiles",
      "previousDatabaseSchemas",
      "previousInterfaceOperations",
    ],
    source: SOURCE,
    state: ctx.state(),
    local: {
      databaseSchemas: props.group.databaseSchemas
        .map((key) => databaseSchemas.get(key))
        .filter((m) => m !== undefined),
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeInterfaceEndpointWriteApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
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

    const designs: AutoBeInterfaceEndpointDesign[] = new HashMap(
      pointer.value.designs.map((c) => new Pair(c.endpoint, c)),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    )
      .toJSON()
      .map((it) => it.second);

    ctx.dispatch({
      id: v7(),
      type: SOURCE,
      kind: props.programmer.kind,
      group: props.group.name,
      analysis: pointer.value.analysis,
      rationale: pointer.value.rationale,
      designs,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      created_at: start.toISOString(),
      step: ctx.state().analyze?.step ?? 0,
      completed: ++props.progress.completed,
      total: props.progress.total,
    } satisfies AutoBeInterfaceEndpointEvent);
    return out(result)(designs);
  });
};

const createController = (props: {
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  >;
  build: (next: IAutoBeInterfaceEndpointWriteApplication.IComplete) => void;
}): ILlmController => {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeInterfaceEndpointWriteApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceEndpointWriteApplication.IProps> =
      typia.validate<IAutoBeInterfaceEndpointWriteApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "complete")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking,
      request: result.data.request,
    });
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfaceEndpointWriteApplication>({
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
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBeInterfaceEndpointWriteApplication,
  };
};

const SOURCE = "interfaceEndpoint" satisfies AutoBeEventSource;
