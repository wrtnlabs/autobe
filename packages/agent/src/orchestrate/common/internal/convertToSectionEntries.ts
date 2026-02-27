import { AutoBeAnalyzeFile } from "@autobe/interface";

import { IAnalysisSectionEntry } from "../structures/IAnalysisSectionEntry";

/**
 * Converts an array of analysis files into a flat array of section entries.
 *
 * Walks the `AutoBeAnalyzeFile.module.modules[].units[].sections[]` hierarchy
 * and produces a flat list with sequential integer IDs for LLM retrieval.
 *
 * @param files - Analysis files with structured module hierarchy
 * @returns Flat array of section entries with sequential IDs starting from 0
 */
export function convertToSectionEntries(
  files: AutoBeAnalyzeFile[],
): IAnalysisSectionEntry[] {
  const entries: IAnalysisSectionEntry[] = [];
  let id = 0;

  for (const file of files) {
    if (!file.module?.modules) continue;
    for (const mod of file.module.modules) {
      for (const unit of mod.units) {
        for (const section of unit.sections) {
          entries.push({
            id: id++,
            filename: file.filename,
            moduleTitle: mod.title,
            unitTitle: unit.title,
            sectionTitle: section.title,
            keywords: unit.keywords,
            content: section.content,
          });
        }
      }
    }
  }
  return entries;
}
