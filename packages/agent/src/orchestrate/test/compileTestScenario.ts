import { AutoBeOpenApi, AutoBeTestScenario } from "@autobe/interface";
import { ILlmSchema, OpenApiTypeChecker } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeTestScenarioArtifacts } from "./structures/IAutoBeTestScenarioArtifacts";

export async function compileTestScenario<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  scenario: AutoBeTestScenario,
): Promise<IAutoBeTestScenarioArtifacts> {
  const document: AutoBeOpenApi.IDocument = filterDocument(
    scenario,
    ctx.state().interface!.document,
  );
  const entries: [string, string][] = Object.entries(
    await ctx.compiler.interface.compile(document),
  );
  const filter = (prefix: string) =>
    Object.fromEntries(entries.filter(([key]) => key.startsWith(prefix)));
  return {
    document,
    sdk: filter("src/api/functional"),
    dto: filter("src/api/structures"),
    e2e: filter("test/features"),
  };
}

function filterDocument(
  scenario: AutoBeTestScenario,
  document: AutoBeOpenApi.IDocument,
): AutoBeOpenApi.IDocument {
  const operations: AutoBeOpenApi.IOperation[] = document.operations.filter(
    (op) =>
      (scenario.endpoint.method === op.method &&
        scenario.endpoint.path === op.path) ||
      scenario.dependencies.some(
        (dp) =>
          dp.endpoint.method === op.method && dp.endpoint.path === op.path,
      ),
  );
  const components: AutoBeOpenApi.IComponents = {
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
