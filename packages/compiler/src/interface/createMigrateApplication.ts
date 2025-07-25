import { AutoBeOpenApi } from "@autobe/interface";
import { transformOpenApiDocument } from "@autobe/utils";
import { NestiaMigrateApplication } from "@nestia/migrate";

export const createMigrateApplication = (
  document: AutoBeOpenApi.IDocument,
): NestiaMigrateApplication => {
  const migrate: NestiaMigrateApplication = new NestiaMigrateApplication(
    transformOpenApiDocument(document),
  );
  migrate.getData().routes.forEach((r) => {
    // @todo -> must be optimized
    r.accessor[r.accessor.length - 1] = document.operations.find(
      (o) => o.path === r.path && o.method === r.method,
    )!.name;
  });
  return migrate;
};
