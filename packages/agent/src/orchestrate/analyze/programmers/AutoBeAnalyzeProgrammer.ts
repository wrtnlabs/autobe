import {
  AutoBeAnalyze,
  AutoBeAnalyzeModuleSection,
  AutoBeAnalyzeUnitSection,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteSectionEvent,
  AutoBeAnalyzeWriteUnitEvent,
} from "@autobe/interface";

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
    const moduleSection: AutoBeAnalyzeModuleSection =
      moduleEvent.moduleSections[moduleIndex]!;
    const unitEvent: AutoBeAnalyzeWriteUnitEvent | undefined =
      unitEvents[moduleIndex];
    const sectionEventsForModule: AutoBeAnalyzeWriteSectionEvent[] | undefined =
      sectionResults[moduleIndex];

    // Module header
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
        const unitSection: AutoBeAnalyzeUnitSection =
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
 * This method builds the hierarchical AutoBeAnalyze.IModule structure from the
 * module, unit, and section events, preserving the three-level hierarchy that
 * would otherwise be lost when assembling into flat markdown.
 */
export const assembleModule = (
  moduleEvent: AutoBeAnalyzeWriteModuleEvent,
  unitEvents: AutoBeAnalyzeWriteUnitEvent[],
  sectionResults: AutoBeAnalyzeWriteSectionEvent[][],
): AutoBeAnalyze.IModule => {
  const firstModuleSection = moduleEvent.moduleSections[0];
  if (!firstModuleSection) {
    return { title: "", purpose: "", content: "", units: [] };
  }

  // Collect all units across all module sections into a single module
  const allUnits: AutoBeAnalyze.IUnit[] = [];

  for (
    let moduleIndex: number = 0;
    moduleIndex < moduleEvent.moduleSections.length;
    moduleIndex++
  ) {
    const unitEvent: AutoBeAnalyzeWriteUnitEvent | undefined =
      unitEvents[moduleIndex];
    const sectionEventsForModule: AutoBeAnalyzeWriteSectionEvent[] | undefined =
      sectionResults[moduleIndex];

    if (unitEvent) {
      for (
        let unitIndex: number = 0;
        unitIndex < unitEvent.unitSections.length;
        unitIndex++
      ) {
        const unitSection: AutoBeAnalyzeUnitSection =
          unitEvent.unitSections[unitIndex]!;
        const sectionEvent: AutoBeAnalyzeWriteSectionEvent | undefined =
          sectionEventsForModule?.[unitIndex];

        const sections: AutoBeAnalyze.ISection[] =
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
