import {
  AutoBeAnalyzeFileScenario,
  AutoBeAnalyzeModuleSection,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import {
  FixedAnalyzeTemplateFeature,
  buildFixedAnalyzeExpandedTemplate,
  expandFixedAnalyzeTemplateUnits,
} from "../structures/FixedAnalyzeTemplate";

export const transformAnalyzeWriteUnitHistory = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFileScenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    moduleIndex: number;
    feedback?: string;
    preliminary: null | AutoBePreliminaryController<"previousAnalysisSections">;
  },
): IAutoBeOrchestrateHistory => {
  const moduleSection: AutoBeAnalyzeModuleSection | undefined =
    props.moduleEvent.moduleSections[props.moduleIndex];

  // Find the matching file template and expand units for this module
  const expandedTemplate = buildFixedAnalyzeExpandedTemplate(
    (props.scenario.features ?? []) as FixedAnalyzeTemplateFeature[],
  );
  const fileIndex = expandedTemplate.findIndex(
    (t) => t.filename === props.file.filename,
  );
  const fileTemplate = fileIndex >= 0 ? expandedTemplate[fileIndex] : undefined;
  const moduleTemplate = fileTemplate?.modules[props.moduleIndex];
  const expandedUnits = moduleTemplate
    ? expandFixedAnalyzeTemplateUnits(
        moduleTemplate,
        props.scenario.entities,
        props.scenario.actors,
      )
    : [];

  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.ANALYZE_WRITE_UNIT,
      },
      ...(props.preliminary?.getHistories() ?? []),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
        ## Language

        The language of the document is ${JSON.stringify(props.scenario.language ?? "en-US")}.

        ## Original User Requirements (READ-ONLY Reference)

        Below is the original user input. Your unit sections MUST cover features described below
        that fall within this module's scope. Do NOT invent features not stated or directly implied.

        ${ctx
          .histories()
          .filter((h) => h.type === "userMessage")
          .flatMap((h) =>
            h.type === "userMessage"
              ? h.contents.filter((c) => c.type === "text").map((c) => c.text)
              : [],
          )
          .join("\n\n---\n\n")}

        ## Document Context

        **Document Title**: ${props.moduleEvent.title}
        **Document Summary**: ${props.moduleEvent.summary}
        **File**: ${props.file.filename}
        **File Scope**: ${fileTemplate?.description ?? props.file.reason}

        ## Domain Entities Reference

        ${props.scenario.entities.map((e) => `- **${e.name}**: ${e.attributes.slice(0, 3).join(", ")}`).join("\n")}

        Units MUST reference ONLY entities listed above.

        ## Approved Module Section Structure

        Here are all the module sections for context:

        ${props.moduleEvent.moduleSections
          .map(
            (section, index) => `
        ### ${index + 1}. ${section.title}
        **Purpose**: ${section.purpose}
        `,
          )
          .join("\n")}

        ## Your Task: Write Content for Module Section ${props.moduleIndex + 1}

        **Module Section**: ${moduleSection?.title ?? "Unknown"}
        **Module Index**: ${props.moduleIndex}
        **Purpose**: ${moduleSection?.purpose ?? "Unknown"}

        ### Pre-defined Unit Sections (FIXED — do NOT change titles or purposes)

        The following unit sections are pre-defined by the template. You MUST write
        \`content\` (8-20 sentences) and \`keywords\` (7-18 structured anchors) for EACH unit below.
        Do NOT add, remove, or rename any units.

        ${expandedUnits
          .map(
            (unit, index) => `
        **Unit ${index + 1}**: ${unit.titlePattern}
        - **Purpose**: ${unit.purposePattern}
        - **Template Keywords** (for reference, expand with domain-specific terms): ${unit.keywords.join(", ")}
        `,
          )
          .join("\n")}

        ## CRITICAL: Value Consistency

        **You MUST use the EXACT same values defined in the module section content above.**
        If the module section says "10MB file limit", you MUST use 10MB, not 25MB or 5MB.
        Any deviation will cause the review to REJECT your output.

        ## CRITICAL: No Duplication with Other Module Sections

        The module sections listed above define clear boundaries. Your unit sections
        for "${moduleSection?.title ?? "Unknown"}" MUST NOT overlap with content belonging
        to other module sections.

        Write content and keywords for all ${expandedUnits.length} pre-defined unit sections.
        ${
          props.feedback
            ? `
        ## Previous Attempt Feedback

        Your previous attempt was rejected with the following feedback. Please address these issues:

        ${props.feedback}
        `
            : ""
        }
      `,
      },
    ],
    userMessage: `Write content and keywords for the ${expandedUnits.length} pre-defined unit sections in module "${moduleSection?.title ?? "Unknown"}".`,
  };
};
