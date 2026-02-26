import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteUnitEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformAnalyzeWriteSectionHistory = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvent: AutoBeAnalyzeWriteUnitEvent;
    allUnitEvents: AutoBeAnalyzeWriteUnitEvent[];
    moduleIndex: number;
    unitIndex: number;
    feedback?: string;
    preliminary: null | AutoBePreliminaryController<"previousAnalysisFiles">;
    attributeRegistry?: string;
    permissionRegistry?: string;
    errorCodeRegistry?: string;
  },
): IAutoBeOrchestrateHistory => {
  const moduleSection:
    | AutoBeAnalyzeWriteModuleEvent.IModuleSection
    | undefined = props.moduleEvent.moduleSections[props.moduleIndex];
  const unitSection: AutoBeAnalyzeWriteUnitEvent.IUnitSection | undefined =
    props.unitEvent.unitSections[props.unitIndex];

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

        ## Document Context

        **Document Title**: ${props.moduleEvent.title}
        **Document Summary**: ${props.moduleEvent.summary}

        ${
          props.file.filename === "00-toc.md"
            ? `
        ## AUTHORITATIVE Document List (TOC MUST use ONLY these filenames)

        ${props.scenario.files
          .map(
            (f, i) =>
              `${i + 1}. [${f.filename}](./${f.filename}) — ${f.documentType}`,
          )
          .join("\n")}

        ## TOC Summary-Only Rules (CRITICAL)

        - DO NOT include requirements, constraints, limits, or error codes
        - DO NOT use SHALL/SHOULD/MUST or IF/WHEN/THEN patterns
        - Use short summaries and simple tables only
        - Reference details by filename instead of restating them
        - EVERY filename reference MUST be a markdown hyperlink: [filename](./filename)
        `
            : ""
        }

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

        ${props.attributeRegistry ? props.attributeRegistry : ""}

        ${props.permissionRegistry ? props.permissionRegistry : ""}

        ${props.errorCodeRegistry ? props.errorCodeRegistry : ""}

        ## CRITICAL: No Duplicate Content

        Each section MUST contain unique information:
        - Do NOT restate requirements already implied by sibling sections' keywords
        - In your [DOWNSTREAM CONTEXT] Bridge Block, define each Entity.attribute ONLY in the first section that introduces it
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
