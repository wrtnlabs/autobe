import {
  AutoBeAnalyzeModule,
  AutoBeAnalyzeSection,
  AutoBeAnalyzeUnit,
  AutoBeAnalyzeWriteAllSectionReviewEvent,
  AutoBeAnalyzeWriteAllUnitReviewEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteModuleReviewEvent,
  AutoBeAnalyzeWriteSectionEvent,
  AutoBeAnalyzeWriteUnitEvent,
} from "@autobe/interface";

export namespace AutoBeAnalyzeProgrammer {
  /** Apply module review revisions to the module event */
  export const applyModuleRevisions = (
    moduleEvent: AutoBeAnalyzeWriteModuleEvent,
    reviewEvent: AutoBeAnalyzeWriteModuleReviewEvent,
  ): AutoBeAnalyzeWriteModuleEvent => {
    return {
      ...moduleEvent,
      title: reviewEvent.revisedTitle?.length
        ? reviewEvent.revisedTitle
        : moduleEvent.title,
      summary: reviewEvent.revisedSummary?.length
        ? reviewEvent.revisedSummary
        : moduleEvent.summary,
      moduleSections: reviewEvent.revisedSections?.length
        ? reviewEvent.revisedSections
        : moduleEvent.moduleSections,
    };
  };

  /** Apply batch unit review revisions to all unit events */
  export const applyAllUnitRevisions = (
    unitEvents: AutoBeAnalyzeWriteUnitEvent[],
    reviewEvent: Pick<AutoBeAnalyzeWriteAllUnitReviewEvent, "revisedUnits">,
  ): AutoBeAnalyzeWriteUnitEvent[] => {
    if (!reviewEvent.revisedUnits) {
      return unitEvents;
    }

    // Create a map of revisions by moduleIndex
    const revisionsMap: Map<
      number,
      AutoBeAnalyzeWriteUnitEvent.IUnitSection[]
    > = new Map();
    for (const revision of reviewEvent.revisedUnits) {
      revisionsMap.set(revision.moduleIndex, revision.unitSections);
    }

    // Apply revisions where available
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

  /** Apply batch section review revisions to all section events */
  export const applyAllSectionRevisions = (
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][],
    reviewEvent: Pick<
      AutoBeAnalyzeWriteAllSectionReviewEvent,
      "revisedSections"
    >,
  ): AutoBeAnalyzeWriteSectionEvent[][] => {
    if (!reviewEvent.revisedSections) {
      return sectionEvents;
    }

    // Create a nested map of revisions by moduleIndex and unitIndex
    const revisionsMap: Map<
      number,
      Map<number, AutoBeAnalyzeWriteSectionEvent.ISectionSection[]>
    > = new Map();
    for (const moduleRevision of reviewEvent.revisedSections) {
      const unitMap: Map<
        number,
        AutoBeAnalyzeWriteSectionEvent.ISectionSection[]
      > = new Map();
      for (const unitRevision of moduleRevision.units) {
        unitMap.set(unitRevision.unitIndex, unitRevision.sectionSections);
      }
      revisionsMap.set(moduleRevision.moduleIndex, unitMap);
    }

    // Apply revisions where available
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
   * This method builds the hierarchical AutoBeAnalyzeModule structure from
   * the module, unit, and section events, preserving the three-level hierarchy
   * that would otherwise be lost when assembling into flat markdown.
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
