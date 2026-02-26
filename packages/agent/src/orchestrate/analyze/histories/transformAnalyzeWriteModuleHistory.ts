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
 * ISO/IEC/IEEE 29148:2018 SRS Structure — Dynamic Module Selection
 *
 * 3 required modules are always present; 7 optional modules are selected by the
 * LLM based on project characteristics. This aligns with the semantic layer's
 * AutoBeAnalyzeDocumentSrs.Category type.
 */
const SRS_STRUCTURE = {
  required: [
    {
      title: "Introduction",
      categoryKey: "introduction",
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
      title: "System Overview",
      categoryKey: "systemOverview",
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
      title: "System Capabilities and Functional Requirements",
      categoryKey: "capabilities",
      purpose:
        "Define capabilities, use cases, and detailed functional requirements.",
      includes: [
        "High-level system capabilities",
        "Use case descriptions with actors",
        "Functional requirements in EARS format",
        "Business rules and invariants",
      ],
    },
  ],
  optional: [
    {
      title: "External Interface Requirements",
      categoryKey: "externalInterface",
      purpose:
        "Describe interfaces with external systems, databases, services, and protocols.",
      includes: [
        "External system integrations",
        "Third-party service dependencies",
        "Data exchange formats and protocols",
        "API integration requirements (NOT internal API specs)",
      ],
      relevanceHint:
        "Include when the system integrates with external services, payment gateways, third-party APIs, or data feeds.",
    },
    {
      title: "Physical and Performance Characteristics",
      categoryKey: "physicalPerformance",
      purpose:
        "Specify physical constraints and quantified performance requirements.",
      includes: [
        "Deployment environment requirements",
        "Hardware constraints",
        "Response time requirements",
        "Throughput and scalability requirements",
        "Availability targets",
      ],
      relevanceHint:
        "Include when the system has specific performance SLOs, scalability needs, or deployment constraints beyond defaults.",
    },
    {
      title: "Security and Quality Attributes",
      categoryKey: "securityQuality",
      purpose: "Define security requirements and quality attribute scenarios.",
      includes: [
        "Authentication and authorization requirements",
        "Data protection requirements",
        "Audit and logging requirements",
        "Reliability requirements",
        "Maintainability considerations",
      ],
      relevanceHint:
        "Include when the system has multi-role authentication, sensitive data handling, compliance requirements, or audit needs.",
    },
    {
      title: "Domain Model and Business Rules",
      categoryKey: "domainModel",
      purpose:
        "Define domain entities, relationships, and core business rules.",
      includes: [
        "Entity definitions and relationships",
        "Business rule catalog",
        "Data invariants and integrity constraints",
      ],
      relevanceHint:
        "Include when the domain has complex entity relationships, business rules, or data integrity constraints beyond what fits in Capabilities.",
    },
    {
      title: "Actor Permission Matrix",
      categoryKey: "actorPermissionMatrix",
      purpose: "Define per-actor permission mappings for all operations.",
      includes: [
        "Role-based access control matrix",
        "Resource-level permission rules",
        "Permission inheritance and escalation rules",
      ],
      relevanceHint:
        "Include when the system has 3+ actor roles with distinct permission boundaries.",
    },
    {
      title: "Workflow and State Machines",
      categoryKey: "workflowStateMachine",
      purpose: "Define state transitions and multi-step workflows.",
      includes: [
        "Entity lifecycle state machines",
        "Multi-step business workflows",
        "Approval chains and escalation paths",
      ],
      relevanceHint:
        "Include when the system has entities with lifecycle states, approval workflows, or multi-step processes.",
    },
    {
      title: "Data Dictionary",
      categoryKey: "dataDictionary",
      purpose:
        "Define per-field constraints, validation rules, and data formats.",
      includes: [
        "Field-level constraints and formats",
        "Validation rule catalog",
        "Default values and computed fields",
      ],
      relevanceHint:
        "Include when the system has complex data validation needs, many entity attributes, or strict data format requirements.",
    },
  ],
};

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

        ## Original User Requirements (READ-ONLY Reference)

        Below is the original user input. Your module structure MUST cover ALL features described below.
        Do NOT invent features not stated or directly implied. Do NOT reinterpret the user's stated system type.

        ${ctx
          .histories()
          .filter((h) => h.type === "userMessage")
          .flatMap((h) =>
            h.type === "userMessage"
              ? h.contents.filter((c) => c.type === "text").map((c) => c.text)
              : [],
          )
          .join("\n\n---\n\n")}

        ## Metadata

        Prefix name of the service to create is ${props.scenario.prefix}
        and here is the list of the actors to reference.

        \`\`\`json
        ${JSON.stringify(props.scenario.actors)}
        \`\`\`

        ## AUTHORITATIVE Entity Catalog

        ${props.scenario.entities.map((e) => `- **${e.name}**: ${e.attributes.join(", ")}${e.relationships?.length ? ` | ${e.relationships.join(", ")}` : ""}`).join("\n")}

        ## CRITICAL: Scope Adherence

        You are writing modules for file "${props.file.filename}".
        Rules:
        - ONLY reference actors defined in the metadata above
        - ONLY reference entities from the Entity Catalog above
        - Do NOT create modules for features excluded from the file's scope
        - TOC entity/workflow summaries must match ONLY entities from the Entity Catalog

        ## SRS Structure (ISO/IEC/IEEE 29148:2018) — Dynamic Module Selection

        Your module sections follow the ISO 29148 standard with dynamic category selection.

        ### Required Modules (MUST always include):

        \`\`\`json
        ${JSON.stringify(SRS_STRUCTURE.required, null, 2)}
        \`\`\`

        ### Optional Modules (include ONLY if relevant to this project):

        \`\`\`json
        ${JSON.stringify(SRS_STRUCTURE.optional, null, 2)}
        \`\`\`

        **MODULE SELECTION RULES**:
        1. Always include all 3 required modules in the order shown.
        2. Evaluate each optional module against the project scope — include ONLY if the \`relevanceHint\` condition is met.
        3. Minimum total: 3 modules (all required). Maximum total: 10 modules (3 required + 7 optional).
        4. Omitted optional modules mean that domain is not complex enough to warrant a separate module — their content may be briefly addressed within the Capabilities module if relevant.
        5. Number each selected module sequentially starting from 1.
        6. Do NOT create empty or padded modules. Each module must have substantial, unique content.

        ### Alternative: Domain-Functional Split (PREFERRED for focused apps)

        **When to use**: Project has ≤ 3 actors AND ≤ 2 external integrations.

        Instead of generic ISO categories (Introduction → System Overview → System Capabilities with ALL features in one module),
        split modules by FUNCTIONAL DOMAIN where each module OWNS one functional domain completely.

        Example for a TodoApp:
        - ✅ Module 1: Service Overview & Authentication
        - ✅ Module 2: Core Todo Functionality
        - ✅ Module 3: Edit History Management
        - ✅ Module 4: Trash and Deletion Workflow
        - ✅ Module 5: Filtering, Sorting, Pagination

        This produces more focused, implementable documents than stuffing all features into a single "Capabilities" module.

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
