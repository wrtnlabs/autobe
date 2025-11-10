import { AgenticaExecuteHistory } from "@agentica/core";
import { AutoBeOpenApi, AutoBePrisma } from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { ILlmSchema, OpenApiTypeChecker } from "@samchon/openapi";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "./AutoBePreliminaryController";
import { IAutoBePreliminaryApplication } from "./structures/IAutoBePreliminaryApplication";

export const orchestratePreliminary = <
  Model extends ILlmSchema.Model,
  Key extends keyof IAutoBePreliminaryApplication,
>(
  ctx: AutoBeContext<Model>,
  props: {
    executes: AgenticaExecuteHistory<Model>[];
    preliminary: AutoBePreliminaryController<Key>;
  },
): void => {
  ctx; // @todo -> dispatch events
  for (const exec of props.executes)
    if (isAnalysisFiles(props.preliminary, exec.operation.function.name))
      fillRequirementAnalyses({
        all: props.preliminary.all.analyzeFiles,
        local: props.preliminary.local.analyzeFiles,
        arguments: exec.operation.function.parameters,
      });
    else if (isPrismaSchemas(props.preliminary, exec.operation.function.name))
      fillPrismaSchemas({
        all: props.preliminary.all.prismaSchemas,
        local: props.preliminary.local.prismaSchemas,
        arguments: exec.operation.function.parameters,
      });
    else if (
      isInterfaceOperations(props.preliminary, exec.operation.function.name)
    )
      fillInterfaceOperations({
        all: {
          operations: props.preliminary.all.interfaceOperations,
          schemas: props.preliminary.all.interfaceSchemas,
        },
        local: {
          operations: props.preliminary.local.interfaceOperations,
          schemas: props.preliminary.local.interfaceSchemas,
        },
        arguments: exec.operation.function.parameters,
      });
    else if (
      isInterfaceSchemas(props.preliminary, exec.operation.function.name)
    )
      fillInterfaceSchemas({
        all: props.preliminary.all.interfaceSchemas,
        local: props.preliminary.local.interfaceSchemas,
        arguments: exec.operation.function.parameters,
      });
};

const isAnalysisFiles = (
  preliminary: AutoBePreliminaryController<any>,
  functionName: string,
): preliminary is AutoBePreliminaryController<"analyzeFiles"> =>
  typia.is<"analyzeFiles">(functionName) &&
  preliminary.all[functionName] !== undefined;

const isPrismaSchemas = (
  preliminary: AutoBePreliminaryController<any>,
  functionName: string,
): preliminary is AutoBePreliminaryController<"prismaSchemas"> =>
  typia.is<"prismaSchemas">(functionName) &&
  preliminary.all[functionName] !== undefined;

const isInterfaceOperations = (
  preliminary: AutoBePreliminaryController<any>,
  functionName: string,
): preliminary is AutoBePreliminaryController<
  "interfaceOperations" | "interfaceSchemas"
> =>
  typia.is<"interfaceOperations">(functionName) &&
  preliminary.all[functionName] !== undefined;

const isInterfaceSchemas = (
  preliminary: AutoBePreliminaryController<any>,
  functionName: string,
): preliminary is AutoBePreliminaryController<"interfaceSchemas"> =>
  typia.is<"interfaceSchemas">(functionName) &&
  preliminary.all[functionName] !== undefined;

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
