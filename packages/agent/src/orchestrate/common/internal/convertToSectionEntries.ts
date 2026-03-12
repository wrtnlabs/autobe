import { AutoBeAnalyze } from "@autobe/interface";

import { IAnalysisSectionEntry } from "../structures/IAnalysisSectionEntry";

let _cachedInput: AutoBeAnalyze.IFile[] | null = null;
let _cachedResult: IAnalysisSectionEntry[] | null = null;

/**
 * Converts an array of analysis files into a flat array of section entries.
 *
 * Walks the `AutoBeAnalyze.IFile.module.units[].sections[]` hierarchy and
 * produces a flat list with sequential integer IDs for LLM retrieval.
 *
 * Uses referential equality memoization: when the same `files` array reference
 * is passed again (common during downstream phases where `state.analyze.files`
 * is immutable), the cached result is returned immediately.
 *
 * @param files - Analysis files with structured module hierarchy
 * @returns Flat array of section entries with sequential IDs starting from 0
 */
export function convertToSectionEntries(
  files: AutoBeAnalyze.IFile[],
): IAnalysisSectionEntry[] {
  if (_cachedInput === files && _cachedResult !== null) {
    return _cachedResult;
  }

  const entries: IAnalysisSectionEntry[] = [];
  let id = 0;

  for (const file of files) {
    if (!file.module) continue;
    const mod = file.module;
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

  _cachedInput = files;
  _cachedResult = entries;
  return entries;
}

export function clearSectionEntriesCache(): void {
  _cachedInput = null;
  _cachedResult = null;
}
