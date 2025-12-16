import {
  AutoBeOpenApi,
  AutoBeTestAuthorizeWriteFunction,
  AutoBeTestGenerateWriteFunction,
  AutoBeTestPrepareWriteFunction,
  AutoBeTestScenario,
  AutoBeTestWriteFunction,
  IAutoBeCompiler,
} from "@autobe/interface";
import { ILlmSchema, OpenApiTypeChecker } from "@samchon/openapi";

import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeTestArtifacts } from "../structures/IAutoBeTestArtifacts";
import { IAutoBeTestScenarioArtifacts } from "../structures/IAutoBeTestScenarioArtifacts";
import { getTestTemplateCode } from "./getTestTemplateCode";

export async function getTestArtifacts<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    endpoint: AutoBeOpenApi.IEndpoint;
    dependencies?: AutoBeOpenApi.IEndpoint[];
  },
): Promise<IAutoBeTestArtifacts> {
  const compiler: IAutoBeCompiler = await ctx.compiler();
  const document: AutoBeOpenApi.IDocument = filterDocument(
    ctx.state().interface!.document,
    {
      endpoint: props.endpoint,
      dependencies: props.dependencies ?? [],
    },
  );

  const entries: [string, string][] = Object.entries(
    await compiler.interface.write(document, []),
  );
  const filter = (prefix: string, exclude?: string) => {
    const result: [string, string][] = entries.filter(
      ([key]) => key.startsWith(prefix) === true,
    );
    return Object.fromEntries(
      exclude
        ? result.filter(([key]) => key.startsWith(exclude) === false)
        : result,
    );
  };
  return {
    document,
    sdk: filter("src/api", "src/api/structures"),
    dto: filter("src/api/structures"),
    e2e: filter("test/features"),
  };
}

export async function getTestScenarioArtifacts<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  scenario: Pick<
    AutoBeTestScenario,
    "endpoint" | "dependencies" | "functionName"
  >,
): Promise<IAutoBeTestScenarioArtifacts> {
  const compiler: IAutoBeCompiler = await ctx.compiler();
  const document: AutoBeOpenApi.IDocument = filterDocument(
    ctx.state().interface!.document,
    {
      endpoint: scenario.endpoint,
      dependencies: scenario.dependencies.map((dp) => dp.endpoint),
    },
  );
  const entries: [string, string][] = Object.entries(
    await compiler.interface.write(document, []),
  );
  const filter = (prefix: string, exclude?: string) => {
    const result: [string, string][] = entries.filter(
      ([key]) => key.startsWith(prefix) === true,
    );
    return Object.fromEntries(
      exclude
        ? result.filter(([key]) => key.startsWith(exclude) === false)
        : result,
    );
  };
  return {
    document,
    sdk: filter("src/api", "src/api/structures"),
    dto: filter("src/api/structures"),
    e2e: filter("test/features"),
    template: getTestTemplateCode(scenario, document),
  };
}

function filterDocument(
  document: AutoBeOpenApi.IDocument,
  props: {
    endpoint: AutoBeOpenApi.IEndpoint;
    dependencies: AutoBeOpenApi.IEndpoint[];
  },
): AutoBeOpenApi.IDocument {
  const operations: AutoBeOpenApi.IOperation[] = document.operations.filter(
    (op) =>
      (props.endpoint.method === op.method &&
        props.endpoint.path === op.path) ||
      props.dependencies.some(
        (dp) => dp.method === op.method && dp.path === op.path,
      ),
  );
  const components: AutoBeOpenApi.IComponents = {
    authorizations: document.components.authorizations,
    schemas: {},
  };
  const visit = (typeName: string) => {
    OpenApiTypeChecker.visit({
      components: document.components,
      schema: { $ref: `#/components/schemas/${typeName}` },
      closure: (s) => {
        if (OpenApiTypeChecker.isReference(s)) {
          const key: string = s.$ref.split("/").pop()!;
          components.schemas[key] = document.components.schemas[key];
        }
      },
    });
  };
  for (const op of operations) {
    if (op.requestBody) visit(op.requestBody.typeName);
    if (op.responseBody) visit(op.responseBody.typeName);
  }
  return {
    operations,
    components,
  };
}

export async function getTestArtifactsFromFunction<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  func:
    | AutoBeTestAuthorizeWriteFunction
    | AutoBeTestGenerateWriteFunction
    | AutoBeTestPrepareWriteFunction
    | AutoBeTestWriteFunction,
): Promise<IAutoBeTestArtifacts> {
  const endpoint: AutoBeOpenApi.IEndpoint = (() => {
    switch (func.type) {
      case "operation":
        return func.scenario.endpoint;
      case "authorize":
      case "generate":
      case "prepare":
        return func.endpoint;
    }
  })();

  const compiler: IAutoBeCompiler = await ctx.compiler();
  const document: AutoBeOpenApi.IDocument = filterDocument(
    ctx.state().interface!.document,
    {
      endpoint,
      dependencies: [],
    },
  );
  const entries: [string, string][] = Object.entries(
    await compiler.interface.write(document, []),
  );
  const filter = (prefix: string, exclude?: string) => {
    const result: [string, string][] = entries.filter(
      ([key]) => key.startsWith(prefix) === true,
    );
    return Object.fromEntries(
      exclude
        ? result.filter(([key]) => key.startsWith(exclude) === false)
        : result,
    );
  };
  return {
    document,
    sdk: filter("src/api", "src/api/structures"),
    dto: filter("src/api/structures"),
    e2e: filter("test/features"),
  };
}
