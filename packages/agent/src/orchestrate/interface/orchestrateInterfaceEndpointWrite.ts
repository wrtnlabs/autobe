import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceEndpointEvent,
  AutoBeInterfaceEndpointRevise,
  AutoBeInterfaceGroup,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { ILlmApplication, ILlmController, IValidation } from "@samchon/openapi";
import { HashSet, IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../structures/IAutoBeOrchestrateHistory";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
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
    groups: AutoBeInterfaceGroup[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeOpenApi.IEndpoint[]> => {
  const matrix: AutoBeOpenApi.IEndpoint[][] = await executeCachedBatch(
    ctx,
    props.groups.map((group) => async (promptCacheKey) => {
      const contents: AutoBeInterfaceEndpointDesign[] = await process(ctx, {
        ...props,
        group,
        promptCacheKey,
      });
      const dict: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
        contents.map((c) => c.endpoint),
        (e) => AutoBeOpenApiEndpointComparator.hashCode(e),
        (a, b) => AutoBeOpenApiEndpointComparator.equals(a, b),
      );
      for (const revise of await props.programmer.review({
        group,
        designs: contents,
        promptCacheKey: promptCacheKey + "_review",
      })) {
        if (revise.type === "create") dict.insert(revise.endpoint);
        else if (revise.type === "update") {
          dict.erase(revise.original);
          dict.insert(revise.updated);
        } else if (revise.type === "erase") dict.erase(revise.endpoint);
        else revise satisfies never;
      }
      return dict.toJSON();
    }),
  );
  return new HashSet(
    matrix.flat(),
    AutoBeOpenApiEndpointComparator.hashCode,
    AutoBeOpenApiEndpointComparator.equals,
  ).toJSON();
};

const process = async (
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
          pointer.value ??= next;
          pointer.value.designs.push(...next.designs);
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

    ctx.dispatch({
      type: SOURCE,
      kind: props.programmer.kind,
      id: v7(),
      designs: pointer.value.designs,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      created_at: start.toISOString(),
      step: ctx.state().analyze?.step ?? 0,
      completed: ++props.progress.completed,
      total: props.progress.total,
    } satisfies AutoBeInterfaceEndpointEvent);
    return out(result)(pointer.value.designs);
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
