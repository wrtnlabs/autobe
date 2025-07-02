import { AutoBeOpenApi } from "@autobe/interface";
import { NestiaMigrateImportProgrammer } from "@nestia/migrate/lib/programmers/NestiaMigrateImportProgrammer";
import { HashMap } from "tstl";

import { IAutoBeTestApiFunction } from "./IAutoBeTestApiFunction";

export interface IAutoBeTestProgrammerContext {
  importer: NestiaMigrateImportProgrammer;
  document: AutoBeOpenApi.IDocument;
  endpoints: HashMap<AutoBeOpenApi.IEndpoint, IAutoBeTestApiFunction>;
}
