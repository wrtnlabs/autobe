import { AgenticaExecuteHistory, MicroAgenticaHistory } from "@agentica/core";
import {
  AutoBeAnalyzeFile,
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBePreliminaryKind,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";
import { OpenApiTypeChecker } from "@samchon/openapi";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "./AutoBePreliminaryController";
import { complementPreliminaryCollection } from "./internal/complementPreliminaryCollection";
import { IAutoBePreliminaryRequest } from "./structures/AutoBePreliminaryRequest";
import { IAutoBePreliminaryCollection } from "./structures/IAutoBePreliminaryCollection";

export const orchestratePreliminary = async <
  Kind extends AutoBePreliminaryKind,
>(
  ctx: AutoBeContext,
  props: {
    source_id: string;
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    histories: MicroAgenticaHistory[];
    preliminary: AutoBePreliminaryController<Kind>;
    trial: number;
  },
): Promise<void> => {
  const executes: AgenticaExecuteHistory[] = props.histories.filter(
    (h) => h.type === "execute",
  );
  if (executes.length === 0)
    throw new Error("Failed to function calling from the preliminary step.");

  for (const exec of executes) {
    // ANALYSIS
    if (isAnalysisFiles(props.preliminary, exec.arguments)) {
      const pa: AutoBePreliminaryController<"analysisFiles"> =
        props.preliminary;
      orchestrateAnalyzeFiles(ctx, {
        source: props.source,
        source_id: props.source_id,
        trial: props.trial,
        all: pa.getAll().analysisFiles,
        local: pa.getLocal().analysisFiles,
        arguments: exec.arguments,
        previous: false,
      });
    } else if (isPreviousAnalysisFiles(props.preliminary, exec.arguments)) {
      const pa: AutoBePreliminaryController<"previousAnalysisFiles"> =
        props.preliminary;
      orchestrateAnalyzeFiles(ctx, {
        source: props.source,
        source_id: props.source_id,
        trial: props.trial,
        all: pa.getAll().previousAnalysisFiles,
        local: pa.getLocal().previousAnalysisFiles,
        arguments: exec.arguments,
        previous: true,
      });
    }
    // PRISMA SCHEMAS
    else if (isPrismaSchemas(props.preliminary, exec.arguments)) {
      const pp: AutoBePreliminaryController<"databaseSchemas"> =
        props.preliminary;
      orchestratePrismaSchemas(ctx, {
        source: props.source,
        source_id: props.source_id,
        trial: props.trial,
        all: pp.getAll().databaseSchemas,
        local: pp.getLocal().databaseSchemas,
        arguments: exec.arguments,
        previous: false,
      });
    } else if (isPreviousPrismaSchemas(props.preliminary, exec.arguments)) {
      const pp: AutoBePreliminaryController<"previousDatabaseSchemas"> =
        props.preliminary;
      orchestratePrismaSchemas(ctx, {
        source: props.source,
        source_id: props.source_id,
        trial: props.trial,
        all: pp.getAll().previousDatabaseSchemas,
        local: pp.getLocal().previousDatabaseSchemas,
        arguments: exec.arguments,
        previous: true,
      });
    }
    // INTERFACE OPERATIONS
    else if (isInterfaceOperations(props.preliminary, exec.arguments)) {
      const pi: AutoBePreliminaryController<"interfaceOperations"> =
        props.preliminary;
      orchestrateInterfaceOperations(ctx, {
        source: props.source,
        source_id: props.source_id,
        trial: props.trial,
        all: pi.getAll().interfaceOperations,
        local: pi.getLocal().interfaceOperations,
        arguments: exec.arguments,
        previous: false,
      });
    } else if (
      isPreviousInterfaceOperations(props.preliminary, exec.arguments)
    ) {
      const pi: AutoBePreliminaryController<"previousInterfaceOperations"> =
        props.preliminary;
      orchestrateInterfaceOperations(ctx, {
        source: props.source,
        source_id: props.source_id,
        trial: props.trial,
        all: pi.getAll().previousInterfaceOperations,
        local: pi.getLocal().previousInterfaceOperations,
        arguments: exec.arguments,
        previous: true,
      });
    }
    // INTERFACE SCHEMAS
    else if (isInterfaceSchemas(props.preliminary, exec.arguments)) {
      const ps: AutoBePreliminaryController<"interfaceSchemas"> =
        props.preliminary;
      orchestrateInterfaceSchemas(ctx, {
        source: props.source,
        source_id: props.source_id,
        trial: props.trial,
        all: ps.getAll().interfaceSchemas,
        local: ps.getLocal().interfaceSchemas,
        arguments: exec.arguments,
        previous: false,
      });
    } else if (isPreviousInterfaceSchemas(props.preliminary, exec.arguments)) {
      const ps: AutoBePreliminaryController<"previousInterfaceSchemas"> =
        props.preliminary;
      orchestrateInterfaceSchemas(ctx, {
        source: props.source,
        source_id: props.source_id,
        trial: props.trial,
        all: ps.getAll().previousInterfaceSchemas,
        local: ps.getLocal().previousInterfaceSchemas,
        arguments: exec.arguments,
        previous: true,
      });
    }
    // REALIZE COLLECTORS
    else if (isRealizeCollectors(props.preliminary, exec.arguments)) {
      const rc: AutoBePreliminaryController<"realizeCollectors"> =
        props.preliminary;
      orchestrateRealizeCollectors(ctx, {
        source: props.source,
        source_id: props.source_id,
        trial: props.trial,
        all: rc.getAll().realizeCollectors,
        local: rc.getLocal().realizeCollectors,
        arguments: exec.arguments,
      });
    }
    // REALIZE TRANSFORMERS
    else if (isRealizeTransformers(props.preliminary, exec.arguments)) {
      const rt: AutoBePreliminaryController<"realizeTransformers"> =
        props.preliminary;
      orchestrateRealizeTransformers(ctx, {
        source: props.source,
        source_id: props.source_id,
        trial: props.trial,
        all: rt.getAll().realizeTransformers,
        local: rt.getLocal().realizeTransformers,
        arguments: exec.arguments,
      });
    }
  }
  complementPreliminaryCollection({
    kinds: props.preliminary.getKinds(),
    all: props.preliminary.getAll() as IAutoBePreliminaryCollection,
    local: props.preliminary.getLocal() as IAutoBePreliminaryCollection,
    prerequisite: false,
  });
};

/* -----------------------------------------------------------
  TYPE CHECKERS
----------------------------------------------------------- */
const isAnalysisFiles = (
  preliminary: AutoBePreliminaryController<any>,
  input: unknown,
): preliminary is AutoBePreliminaryController<"analysisFiles"> =>
  typia.is<IAutoBePreliminaryRequest<"analysisFiles">>(input) &&
  preliminary.getAll()[
    typia.misc.literals<
      Extract<keyof IAutoBePreliminaryCollection, "analysisFiles">
    >()[0]
  ] !== undefined;

const isPreviousAnalysisFiles = (
  preliminary: AutoBePreliminaryController<any>,
  input: unknown,
): preliminary is AutoBePreliminaryController<"previousAnalysisFiles"> =>
  typia.is<IAutoBePreliminaryRequest<"previousAnalysisFiles">>(input) &&
  preliminary.getAll()[
    typia.misc.literals<
      Extract<keyof IAutoBePreliminaryCollection, "previousAnalysisFiles">
    >()[0]
  ] !== undefined;

const isPrismaSchemas = (
  preliminary: AutoBePreliminaryController<any>,
  input: unknown,
): preliminary is AutoBePreliminaryController<"databaseSchemas"> =>
  typia.is<IAutoBePreliminaryRequest<"databaseSchemas">>(input) &&
  preliminary.getAll()[
    typia.misc.literals<
      Extract<keyof IAutoBePreliminaryCollection, "databaseSchemas">
    >()[0]
  ] !== undefined;

const isPreviousPrismaSchemas = (
  preliminary: AutoBePreliminaryController<any>,
  input: unknown,
): preliminary is AutoBePreliminaryController<"previousDatabaseSchemas"> =>
  typia.is<IAutoBePreliminaryRequest<"previousDatabaseSchemas">>(input) &&
  preliminary.getAll()[
    typia.misc.literals<
      Extract<keyof IAutoBePreliminaryCollection, "previousDatabaseSchemas">
    >()[0]
  ] !== undefined;

const isInterfaceOperations = (
  preliminary: AutoBePreliminaryController<any>,
  input: unknown,
): preliminary is AutoBePreliminaryController<"interfaceOperations"> =>
  typia.is<IAutoBePreliminaryRequest<"interfaceOperations">>(input) &&
  preliminary.getAll()[
    typia.misc.literals<
      Extract<keyof IAutoBePreliminaryCollection, "interfaceOperations">
    >()[0]
  ] !== undefined;

const isPreviousInterfaceOperations = (
  preliminary: AutoBePreliminaryController<any>,
  input: unknown,
): preliminary is AutoBePreliminaryController<"previousInterfaceOperations"> =>
  typia.is<IAutoBePreliminaryRequest<"previousInterfaceOperations">>(input) &&
  preliminary.getAll()[
    typia.misc.literals<
      Extract<keyof IAutoBePreliminaryCollection, "previousInterfaceOperations">
    >()[0]
  ] !== undefined;

const isInterfaceSchemas = (
  preliminary: AutoBePreliminaryController<any>,
  input: unknown,
): preliminary is AutoBePreliminaryController<"interfaceSchemas"> =>
  typia.is<IAutoBePreliminaryRequest<"interfaceSchemas">>(input) &&
  preliminary.getAll()[
    typia.misc.literals<
      Extract<keyof IAutoBePreliminaryCollection, "interfaceSchemas">
    >()[0]
  ] !== undefined;

const isPreviousInterfaceSchemas = (
  preliminary: AutoBePreliminaryController<any>,
  input: unknown,
): preliminary is AutoBePreliminaryController<"previousInterfaceSchemas"> =>
  typia.is<IAutoBePreliminaryRequest<"previousInterfaceSchemas">>(input) &&
  preliminary.getAll()[
    typia.misc.literals<
      Extract<keyof IAutoBePreliminaryCollection, "previousInterfaceSchemas">
    >()[0]
  ] !== undefined;

const isRealizeCollectors = (
  preliminary: AutoBePreliminaryController<any>,
  input: unknown,
): preliminary is AutoBePreliminaryController<"realizeCollectors"> =>
  typia.is<IAutoBePreliminaryRequest<"realizeCollectors">>(input) &&
  preliminary.getAll()[
    typia.misc.literals<
      Extract<keyof IAutoBePreliminaryCollection, "realizeCollectors">
    >()[0]
  ] !== undefined;

const isRealizeTransformers = (
  preliminary: AutoBePreliminaryController<any>,
  input: unknown,
): preliminary is AutoBePreliminaryController<"realizeTransformers"> =>
  typia.is<IAutoBePreliminaryRequest<"realizeTransformers">>(input) &&
  preliminary.getAll()[
    typia.misc.literals<
      Extract<keyof IAutoBePreliminaryCollection, "realizeTransformers">
    >()[0]
  ] !== undefined;

/* -----------------------------------------------------------
  ORCHESTRATORS
----------------------------------------------------------- */
const orchestrateAnalyzeFiles = (
  ctx: AutoBeContext,
  props: {
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    source_id: string;
    trial: number;
    all: AutoBeAnalyzeFile[];
    local: AutoBeAnalyzeFile[];
    arguments: unknown;
    previous: boolean;
  },
): void => {
  if (props.previous) {
    if (
      false ===
      typia.is<IAutoBePreliminaryRequest<"previousAnalysisFiles">>(
        props.arguments,
      )
    )
      return;
  } else if (
    false ===
    typia.is<IAutoBePreliminaryRequest<"analysisFiles">>(props.arguments)
  )
    return;

  const existing: string[] = props.local.map((f) => f.filename);
  for (const filename of props.arguments.request.fileNames) {
    const file: AutoBeAnalyzeFile | undefined = props.all.find(
      (f) => f.filename === filename,
    );
    if (file === undefined) continue;
    else if (props.local.find((x) => x.filename === filename) === undefined)
      props.local.push(file);
  }
  ctx.dispatch({
    type: "preliminary",
    id: v7(),
    function: props.previous ? "previousAnalysisFiles" : "analysisFiles",
    source: props.source,
    source_id: props.source_id,
    existing,
    requested: props.arguments.request.fileNames,
    trial: props.trial,
    created_at: new Date().toISOString(),
  });
};

const orchestratePrismaSchemas = (
  ctx: AutoBeContext,
  props: {
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    source_id: string;
    trial: number;
    all: AutoBeDatabase.IModel[];
    local: AutoBeDatabase.IModel[];
    arguments: unknown;
    previous: boolean;
  },
): void => {
  if (props.previous) {
    if (
      false ===
      typia.is<IAutoBePreliminaryRequest<"previousDatabaseSchemas">>(
        props.arguments,
      )
    )
      return;
  } else if (
    false ===
    typia.is<IAutoBePreliminaryRequest<"databaseSchemas">>(props.arguments)
  )
    return;

  const existing: string[] = props.local.map((m) => m.name);
  for (const name of props.arguments.request.schemaNames) {
    const model: AutoBeDatabase.IModel | undefined = props.all.find(
      (m) => m.name === name,
    );
    if (model === undefined) continue;
    else if (props.local.find((m) => m.name === name) === undefined)
      props.local.push(model);
  }
  ctx.dispatch({
    type: "preliminary",
    id: v7(),
    function: props.previous ? "previousDatabaseSchemas" : "databaseSchemas",
    source: props.source,
    source_id: props.source_id,
    existing,
    requested: props.arguments.request.schemaNames,
    trial: props.trial,
    created_at: new Date().toISOString(),
  });
};

const orchestrateInterfaceOperations = (
  ctx: AutoBeContext,
  props: {
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    source_id: string;
    trial: number;
    all: AutoBeOpenApi.IOperation[];
    local: AutoBeOpenApi.IOperation[];
    arguments: unknown;
    previous: boolean;
  },
): void => {
  if (props.previous) {
    if (
      false ===
      typia.is<IAutoBePreliminaryRequest<"previousInterfaceOperations">>(
        props.arguments,
      )
    )
      return;
  } else if (
    false ===
    typia.is<IAutoBePreliminaryRequest<"interfaceOperations">>(props.arguments)
  )
    return;

  const existing: AutoBeOpenApi.IEndpoint[] = props.local.map((o) => ({
    method: o.method,
    path: o.path,
  }));
  for (const endpoint of props.arguments.request.endpoints) {
    if (
      props.local.find(
        (v) => v.method === endpoint.method && v.path === endpoint.path,
      ) !== undefined
    )
      continue; // duplicated

    const operation: AutoBeOpenApi.IOperation | undefined = props.all.find(
      (v) => v.method === endpoint.method && v.path === endpoint.path,
    );
    if (operation !== undefined) props.local.push(operation);
  }
  ctx.dispatch({
    type: "preliminary",
    id: v7(),
    function: props.previous
      ? "previousInterfaceOperations"
      : "interfaceOperations",
    source: props.source,
    source_id: props.source_id,
    existing,
    requested: props.arguments.request.endpoints,
    trial: props.trial,
    created_at: new Date().toISOString(),
  });
};

const orchestrateInterfaceSchemas = (
  ctx: AutoBeContext,
  props: {
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    source_id: string;
    trial: number;
    all: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    local: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    arguments: unknown;
    previous: boolean;
  },
  dispatch: boolean = true,
): void => {
  if (props.previous) {
    if (
      false ===
      typia.is<IAutoBePreliminaryRequest<"previousInterfaceSchemas">>(
        props.arguments,
      )
    )
      return;
  } else if (
    false ===
    typia.is<IAutoBePreliminaryRequest<"interfaceSchemas">>(props.arguments)
  )
    return;

  const existing: string[] = Object.keys(props.local);
  const collected: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
  for (const key of props.arguments.request.typeNames) {
    OpenApiTypeChecker.visit({
      components: {
        schemas: props.all,
      },
      schema: { $ref: `#/components/schemas/${key}` },
      closure: (next) => {
        if (OpenApiTypeChecker.isReference(next)) {
          const last: string = next.$ref.split("/").pop()!;
          collected[last] = props.all[last];
        }
      },
    });
  }
  Object.assign(props.local, collected);

  if (dispatch === true)
    ctx.dispatch({
      type: "preliminary",
      id: v7(),
      function: props.previous
        ? "previousInterfaceSchemas"
        : "interfaceSchemas",
      source: props.source,
      source_id: props.source_id,
      existing,
      requested: props.arguments.request.typeNames,
      trial: props.trial,
      created_at: new Date().toISOString(),
    });
};

const orchestrateRealizeCollectors = (
  ctx: AutoBeContext,
  props: {
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    source_id: string;
    trial: number;
    all: AutoBeRealizeCollectorFunction[];
    local: AutoBeRealizeCollectorFunction[];
    arguments: unknown;
  },
): void => {
  if (
    false ===
    typia.is<IAutoBePreliminaryRequest<"realizeCollectors">>(props.arguments)
  )
    return;

  const existing: string[] = props.local.map((c) => c.plan.dtoTypeName);
  for (const dtoTypeName of props.arguments.request.dtoTypeNames) {
    const collector: AutoBeRealizeCollectorFunction | undefined =
      props.all.find((c) => c.plan.dtoTypeName === dtoTypeName);
    if (collector === undefined) continue;
    else if (
      props.local.find((c) => c.plan.dtoTypeName === dtoTypeName) === undefined
    )
      props.local.push(collector);
  }
  ctx.dispatch({
    type: "preliminary",
    id: v7(),
    function: "realizeCollectors",
    source: props.source,
    source_id: props.source_id,
    existing,
    requested: props.arguments.request.dtoTypeNames,
    trial: props.trial,
    created_at: new Date().toISOString(),
  });
};

const orchestrateRealizeTransformers = (
  ctx: AutoBeContext,
  props: {
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    source_id: string;
    trial: number;
    all: AutoBeRealizeTransformerFunction[];
    local: AutoBeRealizeTransformerFunction[];
    arguments: unknown;
  },
): void => {
  if (
    false ===
    typia.is<IAutoBePreliminaryRequest<"realizeTransformers">>(props.arguments)
  )
    return;

  const existing: string[] = props.local.map((t) => t.plan.dtoTypeName);
  for (const dtoTypeName of props.arguments.request.dtoTypeNames) {
    const transformer: AutoBeRealizeTransformerFunction | undefined =
      props.all.find((t) => t.plan.dtoTypeName === dtoTypeName);
    if (
      transformer !== undefined &&
      existing.find((e) => e === dtoTypeName) === undefined
    )
      props.local.push(transformer);
  }
  ctx.dispatch({
    type: "preliminary",
    id: v7(),
    function: "realizeTransformers",
    source: props.source,
    source_id: props.source_id,
    existing,
    requested: props.arguments.request.dtoTypeNames,
    trial: props.trial,
    created_at: new Date().toISOString(),
  });
};
