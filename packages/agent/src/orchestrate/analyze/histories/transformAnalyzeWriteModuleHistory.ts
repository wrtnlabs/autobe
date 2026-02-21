import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

/**
 * ISO/IEC/IEEE 29148:2018 SRS Structure
 *
 * This structure defines the 6 mandatory module sections for a compliant
 * Software Requirements Specification document.
 */
const SRS_STRUCTURE = [
  {
    section: 1,
    title: "Introduction",
    purpose:
      "Define the purpose, scope, audience, domain glossary, and external references of the system.",
    includes: [
      "Purpose statement (why this system exists)",
      "Scope (what is included and excluded)",
      "Target audience and reading guide",
      "Domain-specific glossary terms",
      "References to external documents or standards",
    ],
  },
  {
    section: 2,
    title: "System Overview",
    purpose:
      "Provide high-level system context including stakeholders, assumptions, and constraints.",
    includes: [
      "System context diagram description",
      "Stakeholder identification",
      "Key assumptions about the operating environment",
      "Known constraints (technical, business, regulatory)",
    ],
  },
  {
    section: 3,
    title: "External Interface Requirements",
    purpose:
      "Describe interfaces with external systems, databases, services, and protocols.",
    includes: [
      "External system integrations",
      "Third-party service dependencies",
      "Data exchange formats and protocols",
      "API integration requirements (NOT internal API specs)",
    ],
  },
  {
    section: 4,
    title: "System Capabilities and Functional Requirements",
    purpose:
      "Define capabilities, use cases, and detailed functional requirements.",
    includes: [
      "High-level system capabilities",
      "Use case descriptions with actors",
      "Functional requirements in EARS format",
      "Business rules and invariants",
    ],
  },
  {
    section: 5,
    title: "Physical and Performance Characteristics",
    purpose:
      "Specify physical constraints and quantified performance requirements.",
    includes: [
      "Deployment environment requirements",
      "Hardware constraints",
      "Response time requirements",
      "Throughput and scalability requirements",
      "Availability targets",
    ],
  },
  {
    section: 6,
    title: "Security and Quality Attributes",
    purpose: "Define security requirements and quality attribute scenarios.",
    includes: [
      "Authentication and authorization requirements",
      "Data protection requirements",
      "Audit and logging requirements",
      "Reliability requirements",
      "Maintainability considerations",
    ],
  },
];

export const transformAnalyzeWriteModuleHistory = (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    feedback?: string;
    preliminary: null | AutoBePreliminaryController<"previousAnalysisFiles">;
  },
): IAutoBeOrchestrateHistory => ({
  histories: [
    ...ctx
      .histories()
      .filter((h) => h.type === "userMessage" || h.type === "assistantMessage")
      .map((h) => {
        if (h.type === "userMessage") {
          return {
            ...h,
            contents: h.contents,
          };
        } else {
          return h;
        }
      }),
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.ANALYZE_WRITE_MODULE,
    },
    ...(props.preliminary?.getHistories() ?? []),
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        ## Language

        The language of the document is ${JSON.stringify(props.scenario.language ?? "en-US")}.

        ## Metadata

        Prefix name of the service to create is ${props.scenario.prefix}
        and here is the list of the actors to reference.

        \`\`\`json
        ${JSON.stringify(props.scenario.actors)}
        \`\`\`

        ## SRS Structure (ISO/IEC/IEEE 29148:2018)

        Your module sections MUST follow this standardized structure:

        \`\`\`json
        ${JSON.stringify(SRS_STRUCTURE, null, 2)}
        \`\`\`

        **IMPORTANT**: Create exactly these 6 module sections in this order.
        Each section's content should follow the purpose described above.

        ## Document to Create

        You need to create the **module section structure** for this document:

        \`\`\`json
        ${JSON.stringify(props.file)}
        \`\`\`

        ## Other Documents (for reference)

        Here is the entire list of the documents that would be published:

        \`\`\`json
        ${JSON.stringify(
          props.scenario.files.filter(
            (f) => f.filename !== props.file.filename,
          ),
        )}
        \`\`\`
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
  userMessage:
    "Create the document's module section structure (title, summary, and ## sections).",
});
