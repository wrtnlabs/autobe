import { AgenticaExecuteHistory } from "@agentica/core";
import { AutoBeOpenApi, AutoBePrisma } from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { ILlmSchema, OpenApiTypeChecker } from "@samchon/openapi";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBePreliminaryApplication } from "./structures/IAutoBePreliminaryApplication";
import { IAutoBePreliminaryCollection } from "./structures/IAutoBePreliminaryCollection";

export const orchestratePreliminary = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    executes: AgenticaExecuteHistory<Model>[];
    all: IAutoBePreliminaryCollection;
    partial: IAutoBePreliminaryCollection;
  },
): void => {
  ctx; // @todo -> dispatch events
  for (const exec of props.executes)
    switch (exec.operation.function.name) {
      case "requirementAnalyses":
        fillRequirementAnalyses({
          all: props.all.analyzeFiles,
          partial: props.partial.analyzeFiles,
          arguments: exec.operation.function.parameters,
        });
        break;
      case "prismaSchemas":
        fillPrismaSchemas({
          all: props.all.prismaSchemas,
          partial: props.partial.prismaSchemas,
          arguments: exec.operation.function.parameters,
        });
        break;
      case "interfaceOperations":
        fillInterfaceOperations({
          all: {
            operations: props.all.interfaceOperations,
            schemas: props.all.interfaceSchemas,
          },
          partial: {
            operations: props.partial.interfaceOperations,
            schemas: props.partial.interfaceSchemas,
          },
          arguments: exec.operation.function.parameters,
        });
        break;
      case "interfaceSchemas":
        fillInterfaceSchemas({
          all: props.all.interfaceSchemas,
          partial: props.partial.interfaceSchemas,
          arguments: exec.operation.function.parameters,
        });
        break;
    }
};

const fillRequirementAnalyses = (props: {
  all: AutoBeAnalyzeFile[];
  partial: AutoBeAnalyzeFile[];
  arguments: unknown;
}): void => {
  if (history === null)
    throw new Error(
      "Cannot fill requirement analyses when analyze history is null.",
    );
  typia.assertGuard<IAutoBePreliminaryApplication.IRequirementAnalysesProps>(
    props.arguments,
  );
  for (const filename of props.arguments.filenames)
    if (props.partial.find((f) => f.filename === filename) === undefined)
      props.partial.push(props.all.find((f) => f.filename === filename)!);
};

const fillPrismaSchemas = (props: {
  all: AutoBePrisma.IModel[];
  partial: AutoBePrisma.IModel[];
  arguments: unknown;
}): void => {
  typia.assertGuard<IAutoBePreliminaryApplication.IPrismaSchemasProps>(
    props.arguments,
  );
  for (const name of props.arguments.schemaNames)
    if (props.partial.find((m) => m.name === name) === undefined)
      props.partial.push(props.all.find((m) => m.name === name)!);
};

const fillInterfaceOperations = (props: {
  all: {
    operations: AutoBeOpenApi.IOperation[];
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  };
  partial: {
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
      props.partial.operations.find(
        (v) => v.method === endpoint.method && v.path === endpoint.path,
      ) !== undefined
    )
      continue;
    const operation: AutoBeOpenApi.IOperation = props.all.operations.find(
      (v) => v.method === endpoint.method && v.path === endpoint.path,
    )!;
    props.partial.operations.push(operation);
    if (operation.requestBody) typeNames.add(operation.requestBody.typeName);
    if (operation.responseBody) typeNames.add(operation.responseBody.typeName);
  }
  fillInterfaceSchemas({
    all: props.all.schemas,
    partial: props.partial.schemas,
    arguments: {
      typeNames: Array.from(typeNames),
    } satisfies IAutoBePreliminaryApplication.IInterfaceSchemasProps,
  });
};

const fillInterfaceSchemas = (props: {
  all: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  partial: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
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
