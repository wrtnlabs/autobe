import {
  AutoBeAnalyzeDocument,
  AutoBeAnalyzeDocumentSection,
  AutoBeAnalyzeDocumentSrs,
  AutoBeAnalyzeDocumentValidation,
  AutoBeAnalyzeModule,
  AutoBeAnalyzeSection,
  AutoBeAnalyzeUnit,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteSectionEvent,
  AutoBeAnalyzeWriteUnitEvent,
} from "@autobe/interface";

export namespace AutoBeAnalyzeProgrammer {
  // ============================================
  // Content Assembly
  // ============================================

  /** Assemble all sections into final markdown content */
  export const assembleContent = (
    moduleEvent: AutoBeAnalyzeWriteModuleEvent,
    unitEvents: AutoBeAnalyzeWriteUnitEvent[],
    sectionResults: AutoBeAnalyzeWriteSectionEvent[][],
  ): string => {
    const lines: string[] = [];

    // Document title and summary
    lines.push(`**${moduleEvent.title}**`);
    lines.push("");
    lines.push(moduleEvent.summary);
    lines.push("");

    // For each module section
    for (
      let moduleIndex: number = 0;
      moduleIndex < moduleEvent.moduleSections.length;
      moduleIndex++
    ) {
      const moduleSection: AutoBeAnalyzeWriteModuleEvent.IModuleSection =
        moduleEvent.moduleSections[moduleIndex]!;
      const unitEvent: AutoBeAnalyzeWriteUnitEvent | undefined =
        unitEvents[moduleIndex];
      const sectionEventsForModule:
        | AutoBeAnalyzeWriteSectionEvent[]
        | undefined = sectionResults[moduleIndex];

      // Module section header
      lines.push(`# ${moduleSection.title}`);
      lines.push("");
      if (moduleSection.content) {
        lines.push(moduleSection.content);
        lines.push("");
      }

      // For each unit section
      if (unitEvent) {
        for (
          let unitIndex: number = 0;
          unitIndex < unitEvent.unitSections.length;
          unitIndex++
        ) {
          const unitSection: AutoBeAnalyzeWriteUnitEvent.IUnitSection =
            unitEvent.unitSections[unitIndex]!;
          const sectionEvent: AutoBeAnalyzeWriteSectionEvent | undefined =
            sectionEventsForModule?.[unitIndex];

          // Unit section header
          lines.push(`## ${unitSection.title}`);
          lines.push("");
          if (unitSection.content) {
            lines.push(unitSection.content);
            lines.push("");
          }

          // For each section section
          if (sectionEvent) {
            for (const sectionSection of sectionEvent.sectionSections) {
              lines.push(`### ${sectionSection.title}`);
              lines.push("");
              lines.push(sectionSection.content);
              lines.push("");
            }
          }
        }
      }
    }

    return lines.join("\n").trim();
  };

  /**
   * Assemble structured module data from events.
   *
   * This method builds the hierarchical AutoBeAnalyzeModule structure from the
   * module, unit, and section events, preserving the three-level hierarchy that
   * would otherwise be lost when assembling into flat markdown.
   */
  export const assembleModule = (
    moduleEvent: AutoBeAnalyzeWriteModuleEvent,
    unitEvents: AutoBeAnalyzeWriteUnitEvent[],
    sectionResults: AutoBeAnalyzeWriteSectionEvent[][],
  ): AutoBeAnalyzeModule => {
    const firstModuleSection = moduleEvent.moduleSections[0];
    if (!firstModuleSection) {
      return { title: "", purpose: "", content: "", units: [] };
    }

    // Collect all units across all module sections into a single module
    const allUnits: AutoBeAnalyzeUnit[] = [];

    for (
      let moduleIndex: number = 0;
      moduleIndex < moduleEvent.moduleSections.length;
      moduleIndex++
    ) {
      const unitEvent: AutoBeAnalyzeWriteUnitEvent | undefined =
        unitEvents[moduleIndex];
      const sectionEventsForModule:
        | AutoBeAnalyzeWriteSectionEvent[]
        | undefined = sectionResults[moduleIndex];

      if (unitEvent) {
        for (
          let unitIndex: number = 0;
          unitIndex < unitEvent.unitSections.length;
          unitIndex++
        ) {
          const unitSection: AutoBeAnalyzeWriteUnitEvent.IUnitSection =
            unitEvent.unitSections[unitIndex]!;
          const sectionEvent: AutoBeAnalyzeWriteSectionEvent | undefined =
            sectionEventsForModule?.[unitIndex];

          const sections: AutoBeAnalyzeSection[] =
            sectionEvent?.sectionSections.map((s) => ({
              title: s.title,
              content: s.content,
            })) ?? [];

          allUnits.push({
            title: unitSection.title,
            purpose: unitSection.purpose,
            content: unitSection.content,
            keywords: unitSection.keywords,
            sections,
          });
        }
      }
    }

    return {
      title: firstModuleSection.title,
      purpose: firstModuleSection.purpose,
      content: firstModuleSection.content,
      units: allUnits,
    };
  };

  // ============================================
  // Evidence Layer Assembly
  // ============================================

  /**
   * Build the Evidence Layer from module/unit/section events.
   *
   * Walks the three-level hierarchy and produces a flat array of
   * {@link AutoBeAnalyzeDocumentSection} entries with sequential IDs in the
   * format `"{fileIndex}-{moduleIndex}-{unitIndex}-{sectionIndex}"`.
   */
  export const assembleEvidence = (
    fileIndex: number,
    moduleEvent: AutoBeAnalyzeWriteModuleEvent,
    unitEvents: AutoBeAnalyzeWriteUnitEvent[],
    sectionResults: AutoBeAnalyzeWriteSectionEvent[][],
  ): AutoBeAnalyzeDocumentSection[] => {
    const sections: AutoBeAnalyzeDocumentSection[] = [];

    for (
      let moduleIndex = 0;
      moduleIndex < moduleEvent.moduleSections.length;
      moduleIndex++
    ) {
      const moduleSection = moduleEvent.moduleSections[moduleIndex]!;
      const moduleSectionId = `${fileIndex}-${moduleIndex}`;

      // Level 1: Module
      sections.push({
        sectionId: moduleSectionId,
        level: 1,
        heading: moduleSection.title,
        content: moduleSection.content,
        parentSectionId: null,
      });

      const unitEvent = unitEvents[moduleIndex];
      const sectionEventsForModule = sectionResults[moduleIndex];

      if (!unitEvent) continue;

      for (
        let unitIndex = 0;
        unitIndex < unitEvent.unitSections.length;
        unitIndex++
      ) {
        const unitSection = unitEvent.unitSections[unitIndex]!;
        const unitSectionId = `${fileIndex}-${moduleIndex}-${unitIndex}`;

        // Level 2: Unit
        sections.push({
          sectionId: unitSectionId,
          level: 2,
          heading: unitSection.title,
          content: unitSection.content,
          parentSectionId: moduleSectionId,
        });

        const sectionEvent = sectionEventsForModule?.[unitIndex];
        if (!sectionEvent) continue;

        for (
          let sectionIndex = 0;
          sectionIndex < sectionEvent.sectionSections.length;
          sectionIndex++
        ) {
          const section = sectionEvent.sectionSections[sectionIndex]!;
          const sectionSectionId = `${fileIndex}-${moduleIndex}-${unitIndex}-${sectionIndex}`;

          // Level 3: Section
          sections.push({
            sectionId: sectionSectionId,
            level: 3,
            heading: section.title,
            content: section.content,
            parentSectionId: unitSectionId,
          });
        }
      }
    }

    return sections;
  };

  // ============================================
  // Validation
  // ============================================

  /**
   * Validate the per-file document structure.
   *
   * Checks:
   *
   * - Every traceable SRS item has at least one `sourceSectionIds` entry
   * - All referenced `sourceSectionIds` exist in the Evidence Layer
   * - Only categories listed in `selectedCategories` have data
   */
  export const assembleValidation = (
    sections: AutoBeAnalyzeDocumentSection[],
    srs: AutoBeAnalyzeDocumentSrs,
  ): AutoBeAnalyzeDocumentValidation => {
    const results: AutoBeAnalyzeDocumentValidation["results"] = [];
    const sectionIdSet = new Set(sections.map((s) => s.sectionId));

    // Collect all traceable items from populated categories
    const traceableItems: Array<{
      path: string;
      sourceSectionIds: string[];
    }> = [];

    const collectTraceable = (obj: unknown, path: string): void => {
      if (obj == null || typeof obj !== "object") return;
      const record = obj as Record<string, unknown>;
      if (Array.isArray(record["sourceSectionIds"])) {
        traceableItems.push({
          path,
          sourceSectionIds: record["sourceSectionIds"] as string[],
        });
      }
      for (const [key, value] of Object.entries(record)) {
        if (key === "sourceSectionIds") continue;
        if (Array.isArray(value)) {
          value.forEach((item, i) =>
            collectTraceable(item, `${path}.${key}[${i}]`),
          );
        } else if (typeof value === "object" && value !== null) {
          collectTraceable(value, `${path}.${key}`);
        }
      }
    };

    for (const category of srs.selectedCategories) {
      const data = srs[category];
      if (data != null) {
        collectTraceable(data, `srs.${category}`);
      }
    }

    // Check: every traceable item has at least one sourceSectionIds
    for (const item of traceableItems) {
      if (item.sourceSectionIds.length === 0) {
        results.push({
          severity: "fail",
          category: "traceability",
          message: `${item.path} has empty sourceSectionIds`,
        });
      }
    }

    // Check: all referenced sourceSectionIds exist in Evidence Layer
    for (const item of traceableItems) {
      for (const id of item.sourceSectionIds) {
        if (!sectionIdSet.has(id)) {
          results.push({
            severity: "fail",
            category: "traceability",
            message: `${item.path} references non-existent sectionId "${id}"`,
            sectionIds: [id],
          });
        }
      }
    }

    // Check: only selectedCategories have data
    for (const category of AutoBeAnalyzeDocumentSrs.ALL_CATEGORIES) {
      const hasData = srs[category] != null;
      const isSelected = srs.selectedCategories.includes(category);
      if (hasData && !isSelected) {
        results.push({
          severity: "warn",
          category: "consistency",
          message: `Category "${category}" has data but is not in selectedCategories`,
        });
      }
    }

    return {
      results,
      isValid: results.every((r) => r.severity !== "fail"),
    };
  };

  // ============================================
  // Document Assembly
  // ============================================

  /**
   * Assemble the complete {@link AutoBeAnalyzeDocument} from Evidence Layer
   * sections and LLM-extracted SRS data.
   */
  export const assembleDocument = (
    sections: AutoBeAnalyzeDocumentSection[],
    srs: AutoBeAnalyzeDocumentSrs,
  ): AutoBeAnalyzeDocument => {
    const validation = assembleValidation(sections, srs);
    return { sections, srs, validation };
  };
}
