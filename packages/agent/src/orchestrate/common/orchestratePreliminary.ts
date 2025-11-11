import { AgenticaExecuteHistory, MicroAgenticaHistory } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBePreliminaryEvent,
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
  Key extends keyof IAutoBePreliminaryApplication,
>(
  ctx: AutoBeContext<Model>,
  props: {
    source_id: string;
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    histories: MicroAgenticaHistory<Model>[];
    preliminary: AutoBePreliminaryController<Key>;
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
      fillRequirementAnalyses({
        all: pa.getAll().analyzeFiles,
        local: pa.getLocal().analyzeFiles,
        arguments: exec.arguments,
      });
    }
    // PRISMA SCHEMAS
    else if (isPrismaSchemas(props.preliminary, exec.operation.function.name)) {
      const pp: AutoBePreliminaryController<"prismaSchemas"> =
        props.preliminary;
      fillPrismaSchemas({
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
      fillInterfaceOperations({
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
      fillInterfaceSchemas({
        all: ps.getAll().interfaceSchemas,
        local: ps.getLocal().interfaceSchemas,
        arguments: exec.arguments,
      });
    }

    // DISPATCH EVENT FOR LOGGING
    if (typia.is<AutoBePreliminaryKind>(exec.operation.function.name))
      ctx.dispatch({
        type: "preliminary",
        id: v7(),
        source: props.source,
        source_id: props.source_id,
        function: exec.operation.function.name,
        arguments: exec.arguments,
        trial: props.trial,
        created_at: new Date().toISOString(),
      } satisfies AutoBePreliminaryEvent);
  }
};

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

const fillRequirementAnalyses = (props: {
  all: AutoBeAnalyzeFile[];
  local: AutoBeAnalyzeFile[];
  arguments: unknown;
}): void => {
  typia.assertGuard<IAutoBePreliminaryApplication.IRequirementAnalysesProps>(
    props.arguments,
  );
  for (const filename of props.arguments.filenames)
    if (props.local.find((f) => f.filename === filename) === undefined)
      props.local.push(props.all.find((f) => f.filename === filename)!);
};

const fillPrismaSchemas = (props: {
  all: AutoBePrisma.IModel[];
  local: AutoBePrisma.IModel[];
  arguments: unknown;
}): void => {
  typia.assertGuard<IAutoBePreliminaryApplication.IPrismaSchemasProps>(
    props.arguments,
  );
  // console.log(
  //   Object.fromEntries(
  //     props.arguments.schemaNames.map((name) => [
  //       name,
  //       props.local.find((m) => m.name === name) !== undefined,
  //     ]),
  //   ),
  // );
  for (const name of props.arguments.schemaNames)
    if (props.local.find((m) => m.name === name) === undefined)
      props.local.push(props.all.find((m) => m.name === name)!);
};

const fillInterfaceOperations = (props: {
  all: {
    operations: AutoBeOpenApi.IOperation[];
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  };
  local: {
    operations: AutoBeOpenApi.IOperation[];
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  };
  arguments: unknown;
}): void => {
  typia.assertGuard<IAutoBePreliminaryApplication.IInterfaceOperationsProps>(
    props.arguments,
  );

  const typeNames: Set<string> = new Set();
  for (const endpoint of props.arguments.endpoints) {
    if (
      props.local.operations.find(
        (v) => v.method === endpoint.method && v.path === endpoint.path,
      ) !== undefined
    )
      continue;
    const operation: AutoBeOpenApi.IOperation = props.all.operations.find(
      (v) => v.method === endpoint.method && v.path === endpoint.path,
    )!;
    props.local.operations.push(operation);
    if (operation.requestBody) typeNames.add(operation.requestBody.typeName);
    if (operation.responseBody) typeNames.add(operation.responseBody.typeName);
  }
  fillInterfaceSchemas({
    all: props.all.schemas,
    local: props.local.schemas,
    arguments: {
      typeNames: Array.from(typeNames),
    } satisfies IAutoBePreliminaryApplication.IInterfaceSchemasProps,
  });
};

const fillInterfaceSchemas = (props: {
  all: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  local: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  arguments: unknown;
}): void => {
  typia.assertGuard<IAutoBePreliminaryApplication.IInterfaceSchemasProps>(
    props.arguments,
  );

  const collected: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
  for (const key of props.arguments.typeNames) {
    const schema: AutoBeOpenApi.IJsonSchemaDescriptive = props.all[key];
    OpenApiTypeChecker.visit({
      components: {
        schemas: props.all,
      },
      schema,
      closure: (next) => {
        if (OpenApiTypeChecker.isReference(next)) {
          const last: string = next.$ref.split("/").pop()!;
          collected[last] = props.all[last];
        }
      },
    });
    Object.assign(props.all, collected);
  }
};
