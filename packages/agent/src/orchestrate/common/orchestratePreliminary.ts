import { AgenticaExecuteHistory, MicroAgenticaHistory } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBePreliminaryKind,
  AutoBePrisma,
} from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { ILlmSchema, OpenApiTypeChecker } from "@samchon/openapi";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "./AutoBePreliminaryController";
import { IAutoBePreliminaryApplication } from "./structures/IAutoBePreliminaryApplication";

export const orchestratePreliminary = async <
  Model extends ILlmSchema.Model,
  Kind extends AutoBePreliminaryKind,
>(
  ctx: AutoBeContext<Model>,
  props: {
    source_id: string;
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    histories: MicroAgenticaHistory<Model>[];
    preliminary: AutoBePreliminaryController<Kind>;
    trial: number;
  },
): Promise<void> => {
  ctx; // @todo -> dispatch events
  const executes: AgenticaExecuteHistory<Model>[] = props.histories.filter(
    (h) => h.type === "execute",
  );
  if (executes.length === 0) throw new Error("Failed to function calling");
  for (const exec of executes) {
    // ANALYSIS
    if (isAnalysisFiles(props.preliminary, exec.operation.function.name)) {
      const pa: AutoBePreliminaryController<"analyzeFiles"> = props.preliminary;
      orchestrateAnalyzeFiles(ctx, {
        source: props.source,
        source_id: props.source_id,
        trial: props.trial,
        all: pa.getAll().analyzeFiles,
        local: pa.getLocal().analyzeFiles,
        arguments: exec.arguments,
      });
    }
    // PRISMA SCHEMAS
    else if (isPrismaSchemas(props.preliminary, exec.operation.function.name)) {
      const pp: AutoBePreliminaryController<"prismaSchemas"> =
        props.preliminary;
      orchestratePrismaSchemas(ctx, {
        source: props.source,
        source_id: props.source_id,
        trial: props.trial,
        all: pp.getAll().prismaSchemas,
        local: pp.getLocal().prismaSchemas,
        arguments: exec.arguments,
      });
    }
    // INTERFACE OPERATIONS
    else if (
      isInterfaceOperations(props.preliminary, exec.operation.function.name)
    ) {
      const pi: AutoBePreliminaryController<
        "interfaceOperations" | "interfaceSchemas"
      > = props.preliminary;
      orchestrateInterfaceOperations(ctx, {
        source: props.source,
        source_id: props.source_id,
        trial: props.trial,
        all: {
          operations: pi.getAll().interfaceOperations,
          schemas: pi.getAll().interfaceSchemas,
        },
        local: {
          operations: pi.getLocal().interfaceOperations,
          schemas: pi.getLocal().interfaceSchemas,
        },
        arguments: exec.arguments,
      });
    }
    // INTERFACE SCHEMAS
    else if (
      isInterfaceSchemas(props.preliminary, exec.operation.function.name)
    ) {
      const ps: AutoBePreliminaryController<"interfaceSchemas"> =
        props.preliminary;
      orchestrateInterfaceSchemas(ctx, {
        source: props.source,
        source_id: props.source_id,
        trial: props.trial,
        all: ps.getAll().interfaceSchemas,
        local: ps.getLocal().interfaceSchemas,
        arguments: exec.arguments,
      });
    }
  }
};

/* -----------------------------------------------------------
  TYPE CHECKERS
----------------------------------------------------------- */
const isAnalysisFiles = (
  preliminary: AutoBePreliminaryController<any>,
  functionName: string,
): preliminary is AutoBePreliminaryController<"analyzeFiles"> =>
  typia.is<"analyzeFiles">(functionName) &&
  preliminary.getAll()[functionName] !== undefined;

const isPrismaSchemas = (
  preliminary: AutoBePreliminaryController<any>,
  functionName: string,
): preliminary is AutoBePreliminaryController<"prismaSchemas"> =>
  typia.is<"prismaSchemas">(functionName) &&
  preliminary.getAll()[functionName] !== undefined;

const isInterfaceOperations = (
  preliminary: AutoBePreliminaryController<any>,
  functionName: string,
): preliminary is AutoBePreliminaryController<
  "interfaceOperations" | "interfaceSchemas"
> =>
  typia.is<"interfaceOperations">(functionName) &&
  preliminary.getAll()[functionName] !== undefined;

const isInterfaceSchemas = (
  preliminary: AutoBePreliminaryController<any>,
  functionName: string,
): preliminary is AutoBePreliminaryController<"interfaceSchemas"> =>
  typia.is<"interfaceSchemas">(functionName) &&
  preliminary.getAll()[functionName] !== undefined;

/* -----------------------------------------------------------
  ORCHESTRATORS
----------------------------------------------------------- */
const orchestrateAnalyzeFiles = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    source_id: string;
    trial: number;
    all: AutoBeAnalyzeFile[];
    local: AutoBeAnalyzeFile[];
    arguments: unknown;
  },
): void => {
  if (
    typia.is<IAutoBePreliminaryApplication.IAnalysisFilesProps>(
      props.arguments,
    ) === false
  )
    return; // unreachable

  const existing: string[] = props.local.map((f) => f.filename);
  for (const filename of props.arguments.fileNames) {
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
    function: "analyzeFiles",
    source: props.source,
    source_id: props.source_id,
    existing,
    requested: props.arguments.fileNames,
    trial: props.trial,
    created_at: new Date().toISOString(),
  });
};

const orchestratePrismaSchemas = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    source_id: string;
    trial: number;
    all: AutoBePrisma.IModel[];
    local: AutoBePrisma.IModel[];
    arguments: unknown;
  },
): void => {
  if (
    typia.is<IAutoBePreliminaryApplication.IPrismaSchemasProps>(
      props.arguments,
    ) === false
  )
    return; // unreachable

  const existing: string[] = props.local.map((m) => m.name);
  for (const name of props.arguments.schemaNames) {
    const model: AutoBePrisma.IModel | undefined = props.all.find(
      (m) => m.name === name,
    );
    if (model === undefined) continue;
    else if (props.local.find((m) => m.name === name) === undefined)
      props.local.push(model);
  }
  ctx.dispatch({
    type: "preliminary",
    id: v7(),
    function: "prismaSchemas",
    source: props.source,
    source_id: props.source_id,
    existing,
    requested: props.arguments.schemaNames,
    trial: props.trial,
    created_at: new Date().toISOString(),
  });
};

const orchestrateInterfaceOperations = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    source_id: string;
    trial: number;
    all: {
      operations: AutoBeOpenApi.IOperation[];
      schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    };
    local: {
      operations: AutoBeOpenApi.IOperation[];
      schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    };
    arguments: unknown;
  },
): void => {
  if (
    typia.is<IAutoBePreliminaryApplication.IInterfaceOperationsProps>(
      props.arguments,
    ) === false
  )
    return; // unreachable

  const existing: AutoBeOpenApi.IEndpoint[] = props.local.operations.map(
    (o) => ({
      method: o.method,
      path: o.path,
    }),
  );

  const typeNames: Set<string> = new Set();
  for (const endpoint of props.arguments.endpoints) {
    if (
      props.local.operations.find(
        (v) => v.method === endpoint.method && v.path === endpoint.path,
      ) !== undefined
    )
      continue; // duplicated

    const operation: AutoBeOpenApi.IOperation | undefined =
      props.all.operations.find(
        (v) => v.method === endpoint.method && v.path === endpoint.path,
      );
    if (operation === undefined) continue; // not found (???)

    props.local.operations.push(operation);
    if (operation.requestBody !== null)
      typeNames.add(operation.requestBody.typeName);
    if (operation.responseBody !== null)
      typeNames.add(operation.responseBody.typeName);
  }
  ctx.dispatch({
    type: "preliminary",
    id: v7(),
    function: "interfaceOperations",
    source: props.source,
    source_id: props.source_id,
    existing,
    requested: props.arguments.endpoints,
    trial: props.trial,
    created_at: new Date().toISOString(),
  });

  orchestrateInterfaceSchemas(
    ctx,
    {
      source: props.source,
      source_id: props.source_id,
      trial: props.trial,
      all: props.all.schemas,
      local: props.local.schemas,
      arguments: {
        typeNames: Array.from(typeNames),
      } satisfies IAutoBePreliminaryApplication.IInterfaceSchemasProps,
    },
    false,
  );
};

const orchestrateInterfaceSchemas = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    source_id: string;
    trial: number;
    all: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    local: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    arguments: unknown;
  },
  dispatch: boolean = true,
): void => {
  if (
    typia.is<IAutoBePreliminaryApplication.IInterfaceSchemasProps>(
      props.arguments,
    ) == false
  )
    return; // unreachable

  const existing: string[] = Object.keys(props.local);

  const collected: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
  for (const key of props.arguments.typeNames) {
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
      function: "interfaceSchemas",
      source: props.source,
      source_id: props.source_id,
      existing,
      requested: props.arguments.typeNames,
      trial: props.trial,
      created_at: new Date().toISOString(),
    });
};
