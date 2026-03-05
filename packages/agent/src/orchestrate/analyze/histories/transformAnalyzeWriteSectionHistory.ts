import {
  AutoBeAnalyzeFileScenario,
  AutoBeAnalyzeModuleSection,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeUnitSection,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteUnitEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import {
  FixedAnalyzeTemplateFeature,
  buildFixedAnalyzeCanonicalSourceContent,
  buildFixedAnalyzeExpandedTemplate,
} from "../structures/FixedAnalyzeTemplate";

export const transformAnalyzeWriteSectionHistory = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFileScenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvent: AutoBeAnalyzeWriteUnitEvent;
    allUnitEvents: AutoBeAnalyzeWriteUnitEvent[];
    moduleIndex: number;
    unitIndex: number;
    feedback?: string;
    preliminary: null | AutoBePreliminaryController<"previousAnalysisSections">;
  },
): IAutoBeOrchestrateHistory => {
  const moduleSection: AutoBeAnalyzeModuleSection | undefined =
    props.moduleEvent.moduleSections[props.moduleIndex];
  const unitSection: AutoBeAnalyzeUnitSection | undefined =
    props.unitEvent.unitSections[props.unitIndex];

  // Find the file template for scope context (using expanded template for conditional modules)
  const expandedTemplate = buildFixedAnalyzeExpandedTemplate(
    (props.scenario.features ?? []) as FixedAnalyzeTemplateFeature[],
  );
  const fileTemplate = expandedTemplate.find(
    (t) => t.filename === props.file.filename,
  );

  // Build scope summary for all 6 files
  const fileScopeSummary = expandedTemplate
    .map(
      (t) =>
        `- **${t.filename}**: ${t.description}${t.filename === props.file.filename ? " ← **YOU ARE HERE**" : ""}`,
    )
    .join("\n");

  // Build canonical source declaration
  const canonicalSourceDeclaration = buildFixedAnalyzeCanonicalSourceContent();

  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.ANALYZE_WRITE_SECTION,
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

        Below is the original user input. ALL your sections MUST be traceable to these requirements.
        Do NOT invent features, constraints, or behaviors not stated or directly implied below.

        ${ctx
          .histories()
          .filter((h) => h.type === "userMessage")
          .flatMap((h) =>
            h.type === "userMessage"
              ? h.contents.filter((c) => c.type === "text").map((c) => c.text)
              : [],
          )
          .join("\n\n---\n\n")}

        ## AUTHORITATIVE Scope Reference

        **Service Prefix**: ${props.scenario.prefix}
        **Actors**: ${JSON.stringify(props.scenario.actors.map((a) => ({ name: a.name, kind: a.kind })))}
        **Domain Entities**:
        ${props.scenario.entities.map((e) => `- **${e.name}**: ${e.attributes.slice(0, 5).join(", ")}${e.relationships?.length ? ` | ${e.relationships.join(", ")}` : ""}`).join("\n")}

        **CRITICAL**: You MUST NOT reference entities, actors, or features not listed above.
        If actors are [guest, member], do NOT introduce "admin" or "moderator".
        If entities are [Todo, User], do NOT introduce "Project" or "Label".

        ## File Scope Context

        **Current File**: ${props.file.filename}
        **File Scope**: ${fileTemplate?.description ?? props.file.reason}

        ### All SRS Files (Fixed 6-File Structure)

        ${fileScopeSummary}

        ### Canonical Source Declaration

        ${canonicalSourceDeclaration}

        ${
          fileTemplate?.yamlSpecs?.length
            ? `
        ### YAML Spec Block Required

        This file is a **canonical source** file. Sections in this file MUST include
        structured YAML code blocks for machine-parseable data. See the prompt for format details.
        `
            : ""
        }

        ## Document Context

        **Document Title**: ${props.moduleEvent.title}
        **Document Summary**: ${props.moduleEvent.summary}

        ## Parent Module Section

        **Module Index**: ${props.moduleIndex}
        **Title**: ${moduleSection?.title ?? "Unknown"}
        **Purpose**: ${moduleSection?.purpose ?? "Unknown"}
        **Content**: ${moduleSection?.content ?? "No content"}

        ## Parent Unit Section

        **Unit Index**: ${props.unitIndex}
        **Title**: ${unitSection?.title ?? "Unknown"}
        **Purpose**: ${unitSection?.purpose ?? "Unknown"}
        **Content**: ${unitSection?.content ?? "Unknown"}

        ## CRITICAL: Value Consistency

        **You MUST use the EXACT same values defined in parent sections above.**
        If the parent section says "10MB file limit", you MUST use 10MB, not 25MB or 5MB.
        If the parent section says "5 attachments maximum", you MUST use 5, not 10.
        Any deviation will cause the review to REJECT your output.

        ## CRITICAL: No Duplicate Content

        Each section MUST contain unique information:
        - Do NOT restate requirements already implied by sibling sections' keywords
        - Define each Entity.attribute ONLY in the first section that introduces it
        - Subsequent sections referencing the same attribute should use: "(defined in [Section Name])"
        - Do NOT duplicate state transitions, operations, or permission rules across sections

        ## Keywords to Address

        You MUST create sections that address these keywords:

        ${unitSection?.keywords.map((kw, i) => `${i + 1}. ${kw}`).join("\n") ?? "No keywords"}

        ## Sibling Unit Summaries (do NOT duplicate this content)

        ${props.allUnitEvents
          .flatMap((unitEvt, mi) =>
            unitEvt.unitSections
              .map((unit, ui) => {
                if (mi === props.moduleIndex && ui === props.unitIndex)
                  return null;
                return `- **Module ${mi + 1} > ${unit.title}**: ${unit.keywords.slice(0, 5).join(", ")}`;
              })
              .filter(Boolean),
          )
          .join("\n")}

        ## Your Task

        Create detailed sections (#### level) with EARS-formatted requirements
        that address ALL the keywords above.
        ${
          props.feedback
            ? `
        ## Previous Attempt Feedback

        Your previous attempt was rejected. Please address these issues:

        ${props.feedback}
        `
            : ""
        }
      `,
      },
    ],
    userMessage: `Create detailed sections with EARS requirements for "${unitSection?.title ?? "Unknown"}".`,
  };
};
