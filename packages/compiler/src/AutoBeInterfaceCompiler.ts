import { AutoBeOpenApi, IAutoBeInterfaceCompiler } from "@autobe/interface";
import { MigrateApplication } from "@nestia/migrate";
import { OpenApi, OpenApiV3_1 } from "@samchon/openapi";
import sortImport from "@trivago/prettier-plugin-sort-imports";
import { format } from "prettier";
import jsDoc from "prettier-plugin-jsdoc";
import { IValidation } from "typia";

import { AutoBeCompilerConstants } from "./raw/AutoBeCompilerConstants";

export class AutoBeInterfaceCompiler implements IAutoBeInterfaceCompiler {
  public async compile(
    document: AutoBeOpenApi.IDocument,
  ): Promise<Record<string, string>> {
    const swagger: OpenApi.IDocument = createOpenApiDocument(document);
    const migrate: IValidation<MigrateApplication> =
      MigrateApplication.create(swagger);
    if (migrate.success === false) {
      // never be happened
      throw new Error("Failed to pass validation.");
    }
    const result: MigrateApplication.IOutput = migrate.data.nest({
      simulate: true,
      e2e: true,
    });
    return {
      ...Object.fromEntries(
        await Promise.all(
          result.files.map(async (f) => [
            `${f.location}/${f.file}`,
            f.file.endsWith(".ts") && f.file.endsWith(".d.ts") === false
              ? await beautify(f.content)
              : f.content,
          ]),
        ),
      ),
      "packages/api/swagger.json": JSON.stringify(swagger, null, 2),
      "README.md": AutoBeCompilerConstants.README,
    };
  }
}

async function beautify(script: string) {
  try {
    return await format(script, {
      parser: "typescript",
      plugins: [sortImport, jsDoc],
      importOrder: ["<THIRD_PARTY_MODULES>", "^[./]"],
      importOrderSeparation: true,
      importOrderSortSpecifiers: true,
      importOrderParserPlugins: ["decorators-legacy", "typescript", "jsx"],
    });
  } catch {
    return script;
  }
}

function createOpenApiDocument(
  route: AutoBeOpenApi.IDocument,
): OpenApi.IDocument {
  const paths: Record<string, OpenApi.IPath> = {};
  for (const op of route.operations) {
    paths[op.path] ??= {};
    paths[op.path][op.method] = {
      description: op.description,
      parameters: op.parameters.map((p) => ({
        name: p.name,
        in: "path",
        schema: p.schema,
        description: p.description,
        required: true,
      })),
      requestBody: op.requestBody
        ? {
            content: {
              "application/json": {
                schema: {
                  $ref: `#.components/schemas/${op.requestBody.typeName}`,
                },
              },
            },
            description: op.description,
            required: true,
          }
        : undefined,
      responses: op.responseBody
        ? {
            [op.method === "post" ? 201 : 200]: {
              content: {
                "application/json": {
                  schema: {
                    $ref: `#/components/schemas/${op.responseBody.typeName}`,
                  },
                },
              },
              description: op.description,
            },
          }
        : undefined,
    };
  }
  return OpenApi.convert({
    openapi: "3.1.0",
    paths,
    components: route.components,
  } as OpenApiV3_1.IDocument);
}
