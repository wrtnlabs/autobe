import { AutoBeOpenApi } from "@autobe/interface";
import { transformOpenApiDocument } from "@autobe/utils";
import { NestiaMigrateApplication } from "@nestia/migrate";

export const createMigrateApplication = (
  document: AutoBeOpenApi.IDocument,
): NestiaMigrateApplication => {
  const migrate: NestiaMigrateApplication = new NestiaMigrateApplication(
    transformOpenApiDocument(document),
  );
  return migrate;
};
