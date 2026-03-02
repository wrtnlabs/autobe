import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteSectionEvent,
  AutoBeAnalyzeWriteUnitEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformAnalyzeWriteSectionPatchHistory = (
  _ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvent: AutoBeAnalyzeWriteUnitEvent;
    moduleIndex: number;
    unitIndex: number;
    previousSectionEvent: AutoBeAnalyzeWriteSectionEvent;
    feedback: string;
    preliminary: null | AutoBePreliminaryController<"previousAnalysisFiles">;
    sectionIndices?: number[] | null;
  },
): IAutoBeOrchestrateHistory => {
  const moduleSection:
    | AutoBeAnalyzeWriteModuleEvent.IModuleSection
    | undefined = props.moduleEvent.moduleSections[props.moduleIndex];
  const unitSection: AutoBeAnalyzeWriteUnitEvent.IUnitSection | undefined =
    props.unitEvent.unitSections[props.unitIndex];

  const hasSectionTargets =
    props.sectionIndices != null && props.sectionIndices.length > 0;
  const targetSet = hasSectionTargets ? new Set(props.sectionIndices) : null;

  const previousOutputBlock = hasSectionTargets
    ? `The following sections were generated. Sections marked [NEEDS FIX] must be corrected.
Sections marked [APPROVED] must be returned EXACTLY as-is, character-for-character.

${props.previousSectionEvent.sectionSections
  .map(
    (s, i) => `
### Section ${i + 1}: ${s.title} ${targetSet!.has(i) ? "[NEEDS FIX]" : "[APPROVED - DO NOT MODIFY]"}

${s.content}
`,
  )
  .join("\n---\n")}`
    : `The following sections were generated but REJECTED by review:

${props.previousSectionEvent.sectionSections
  .map(
    (s, i) => `
### Section ${i + 1}: ${s.title}

${s.content}
`,
  )
  .join("\n---\n")}`;

  const taskBlock = hasSectionTargets
    ? `Fix ONLY sections marked [NEEDS FIX] (section indices: ${props.sectionIndices!.map((i) => i + 1).join(", ")}).
Return ALL sections (both fixed and unchanged) in the same sectionSections format.
Sections marked [APPROVED] MUST be returned EXACTLY as they appear above -- do NOT modify them.`
    : `Fix ONLY the issues identified above. Return ALL sections
(both fixed and unchanged) in the same sectionSections format.
Do NOT rewrite sections that were not flagged in the feedback.`;

  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.ANALYZE_WRITE_SECTION_PATCH,
      },
      ...(props.preliminary?.getHistories() ?? []),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
        ## Parent Context

        **Module**: ${moduleSection?.title ?? "Unknown"}
        **Unit**: ${unitSection?.title ?? "Unknown"}
        **Purpose**: ${unitSection?.purpose ?? "Unknown"}

        ## AUTHORITATIVE Scope Reference

        **Service Prefix**: ${props.scenario.prefix}
        **Actors**: ${JSON.stringify(props.scenario.actors.map((a) => ({ name: a.name, kind: a.kind })))}
        **Domain Entities**:
        ${props.scenario.entities.map((e) => `- **${e.name}**: ${e.attributes.slice(0, 5).join(", ")}${e.relationships?.length ? ` | ${e.relationships.join(", ")}` : ""}`).join("\n")}

        **CRITICAL**: You MUST NOT reference entities, actors, or features not listed above.

        ## Previous Output

        ${previousOutputBlock}

        ## Review Feedback

        The review REJECTED the above output for these reasons:

        ${props.feedback}

        ## Your Task

        ${taskBlock}
        `,
      },
    ],
    userMessage: `Fix the rejected sections for "${unitSection?.title ?? "Unknown"}" based on the review feedback above.`,
  };
};
