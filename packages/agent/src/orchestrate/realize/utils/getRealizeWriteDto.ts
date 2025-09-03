import { AutoBeOpenApi, IAutoBeCompiler } from "@autobe/interface";
import { ILlmSchema, OpenApiTypeChecker } from "@samchon/openapi";

import { AutoBeContext } from "../../../context/AutoBeContext";

export async function getRealizeWriteDto<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  operation: AutoBeOpenApi.IOperation,
): Promise<Record<string, string>> {
  const document: AutoBeOpenApi.IDocument = filterDocument(
    operation,
    ctx.state().interface!.document,
  );

  const compiler: IAutoBeCompiler = await ctx.compiler();
  const entries: [string, string][] = Object.entries(
    await compiler.interface.write(document),
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

  const dto: Record<string, string> = filter("src/api/structures");
  return dto;
}

function filterDocument(
  operation: AutoBeOpenApi.IOperation,
  document: AutoBeOpenApi.IDocument,
): AutoBeOpenApi.IDocument {
  const components: AutoBeOpenApi.IComponents = {
    authorization: document.components.authorization,
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

  if (operation.requestBody) visit(operation.requestBody.typeName);
  if (operation.responseBody) visit(operation.responseBody.typeName);

  return {
    operations: [operation],
    components,
  };
}
