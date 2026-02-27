import {
  AutoBeAnalyzeModule,
  AutoBeAnalyzeModuleReviewEvent,
  AutoBeAnalyzeSection,
  AutoBeAnalyzeSectionReviewEvent,
  AutoBeAnalyzeUnit,
  AutoBeAnalyzeUnitReviewEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteSectionEvent,
  AutoBeAnalyzeWriteUnitEvent,
} from "@autobe/interface";

export namespace AutoBeAnalyzeProgrammer {
  // Revision Application

  /** Apply cross-file module review revisions to a single file's module event */
  export const applyModuleRevisions = (
    moduleEvent: AutoBeAnalyzeWriteModuleEvent,
    fileResult: AutoBeAnalyzeModuleReviewEvent.IFileResult,
  ): AutoBeAnalyzeWriteModuleEvent => {
    return {
      ...moduleEvent,
      title: fileResult.revisedTitle?.length
        ? fileResult.revisedTitle
        : moduleEvent.title,
      summary: fileResult.revisedSummary?.length
        ? fileResult.revisedSummary
        : moduleEvent.summary,
      moduleSections: fileResult.revisedSections?.length
        ? fileResult.revisedSections
        : moduleEvent.moduleSections,
    };
  };

  /** Apply cross-file unit review revisions to a single file's unit events */
  export const applyUnitRevisions = (
    unitEvents: AutoBeAnalyzeWriteUnitEvent[],
    fileResult: AutoBeAnalyzeUnitReviewEvent.IFileResult,
  ): AutoBeAnalyzeWriteUnitEvent[] => {
    if (!fileResult.revisedUnits) {
      return unitEvents;
    }

    const revisionsMap: Map<
      number,
      AutoBeAnalyzeWriteUnitEvent.IUnitSection[]
    > = new Map();
    for (const revision of fileResult.revisedUnits) {
      revisionsMap.set(revision.moduleIndex, revision.unitSections);
    }

    return unitEvents.map((unitEvent, moduleIndex) => {
      const revisedSections:
        | AutoBeAnalyzeWriteUnitEvent.IUnitSection[]
        | undefined = revisionsMap.get(moduleIndex);
      if (revisedSections) {
        return { ...unitEvent, unitSections: revisedSections };
      }
      return unitEvent;
    });
  };

  /** Apply cross-file section review revisions to a single file's section events */
  export const applySectionRevisions = (
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][],
    fileResult: AutoBeAnalyzeSectionReviewEvent.IFileResult,
  ): AutoBeAnalyzeWriteSectionEvent[][] => {
    if (!fileResult.revisedSections) {
      return sectionEvents;
    }

    const revisionsMap: Map<
      number,
      Map<number, AutoBeAnalyzeWriteSectionEvent.ISectionSection[]>
    > = new Map();
    for (const moduleRevision of fileResult.revisedSections) {
      const unitMap: Map<
        number,
        AutoBeAnalyzeWriteSectionEvent.ISectionSection[]
      > = new Map();
      for (const unitRevision of moduleRevision.units) {
        unitMap.set(unitRevision.unitIndex, unitRevision.sectionSections);
      }
      revisionsMap.set(moduleRevision.moduleIndex, unitMap);
    }

    return sectionEvents.map((sectionsForModule, moduleIndex) => {
      const unitMap:
        | Map<number, AutoBeAnalyzeWriteSectionEvent.ISectionSection[]>
        | undefined = revisionsMap.get(moduleIndex);
      if (!unitMap) {
        return sectionsForModule;
      }

      return sectionsForModule.map((sectionEvent, unitIndex) => {
        const revisedSections:
          | AutoBeAnalyzeWriteSectionEvent.ISectionSection[]
          | undefined = unitMap.get(unitIndex);
        if (revisedSections) {
          return { ...sectionEvent, sectionSections: revisedSections };
        }
        return sectionEvent;
      });
    });
  };

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
    const modules: AutoBeAnalyzeModule.IModule[] = [];

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

      const units: AutoBeAnalyzeUnit[] = [];

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

          units.push({
            title: unitSection.title,
            purpose: unitSection.purpose,
            content: unitSection.content,
            keywords: unitSection.keywords,
            sections,
          });
        }
      }

      modules.push({
        title: moduleSection.title,
        purpose: moduleSection.purpose,
        content: moduleSection.content,
        units,
      });
    }

    return {
      title: moduleEvent.title,
      summary: moduleEvent.summary,
      modules,
    };
  };
}
