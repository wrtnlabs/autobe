import { AutoBeOpenApi } from "@autobe/interface";
import { NestiaMigrateImportProgrammer } from "@nestia/migrate/lib/programmers/NestiaMigrateImportProgrammer";

export interface IAutoBeTestProgrammerContext {
  importer: NestiaMigrateImportProgrammer;
  document: AutoBeOpenApi.IDocument;
}
