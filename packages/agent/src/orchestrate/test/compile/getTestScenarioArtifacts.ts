import { AutoBeOpenApi, AutoBeTestScenario } from "@autobe/interface";
import { ILlmSchema, OpenApiTypeChecker } from "@samchon/openapi";

import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeTestScenarioArtifacts } from "../structures/IAutoBeTestScenarioArtifacts";

export async function getTestScenarioArtifacts<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  scenario: Pick<AutoBeTestScenario, "endpoint" | "dependencies">,
): Promise<IAutoBeTestScenarioArtifacts> {
  const document: AutoBeOpenApi.IDocument = filterDocument(
    scenario,
    ctx.state().interface!.document,
  );
  const entries: [string, string][] = Object.entries(
    await ctx.compiler.interface.write(document),
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

function filterDocument(
  scenario: Pick<AutoBeTestScenario, "endpoint" | "dependencies">,
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
