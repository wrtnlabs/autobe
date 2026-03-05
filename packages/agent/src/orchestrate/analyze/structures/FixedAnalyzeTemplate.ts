import { AutoBeAnalyzeFileScenario } from "@autobe/interface";

/**
 * Fixed 6-category SRS document structure template.
 *
 * Defines the authoritative structure for all analysis documents. LLM is no
 * longer responsible for deciding file count, file names, or module/unit
 * layout. Instead, it focuses solely on content generation within this fixed
 * skeleton.
 *
 * Hierarchy: Category (file) -> Module (#) -> Unit (##) -> Section (###)
 *
 * @author Juntak
 */

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type FixedAnalyzeTemplateCategoryId =
  | "00-toc"
  | "01-actors-and-auth"
  | "02-domain-model"
  | "03-functional-requirements"
  | "04-business-rules"
  | "05-non-functional";

export interface FixedAnalyzeTemplateFileTemplate {
  categoryId: FixedAnalyzeTemplateCategoryId;
  /** Currently equals categoryId; reserved for future per-category splits. */
  fileId: string;
  filename: `${string}.md`;
  documentType: string;
  description: string;
  downstreamPhase: string;
  modules: FixedAnalyzeTemplateModuleTemplate[];
  /** Regex patterns that must NOT appear in this file's sections. */
  forbiddenPatterns: RegExp[];
  /** YAML spec block definitions for canonical files (01/02/04). */
  yamlSpecs?: FixedAnalyzeTemplateYamlSpecDefinition[];
}

export interface FixedAnalyzeTemplateYamlSpecDefinition {
  /** Root key of the YAML block (e.g., "entity", "errors", "permissions"). */
  rootKey: string;
  /** Module index where this YAML block lives. */
  moduleIndex: number;
  /** Registry type this YAML feeds into. */
  registryType: "domain-concepts" | "error-conditions" | "permissions";
}

export interface FixedAnalyzeTemplateModuleTemplate {
  index: number;
  title: string;
  purpose: string;
  unitStrategy: FixedAnalyzeTemplateUnitStrategy;
}

export type FixedAnalyzeTemplateUnitStrategy =
  | FixedAnalyzeTemplateFixedUnits
  | FixedAnalyzeTemplatePerEntityUnits
  | FixedAnalyzeTemplatePerActorUnits
  | FixedAnalyzeTemplatePerEntityGroupUnits;

export interface FixedAnalyzeTemplateFixedUnits {
  type: "fixed";
  units: FixedAnalyzeTemplateUnitTemplate[];
}
export interface FixedAnalyzeTemplatePerEntityUnits {
  type: "perEntity";
  unitTemplate: FixedAnalyzeTemplateUnitTemplate;
}
export interface FixedAnalyzeTemplatePerActorUnits {
  type: "perActor";
  unitTemplate: FixedAnalyzeTemplateUnitTemplate;
}
export interface FixedAnalyzeTemplatePerEntityGroupUnits {
  type: "perEntityGroup";
  unitTemplate: FixedAnalyzeTemplateUnitTemplate;
}

export interface FixedAnalyzeTemplateUnitTemplate {
  titlePattern: string;
  purposePattern: string;
  keywords: string[];
  /** Whether this unit must contain a canonical YAML spec block. */
  requiresYamlSpec?: boolean;
}

// ─────────────────────────────────────────────
// Feature types (conditional module activation)
// ─────────────────────────────────────────────

export type FixedAnalyzeTemplateFeatureId =
  | "real-time"
  | "external-integration"
  | "background-processing"
  | "file-storage";

export interface FixedAnalyzeTemplateFeature {
  id: FixedAnalyzeTemplateFeatureId;
  /** Provider names for external-integration (e.g., ["stripe", "sendgrid"]) */
  providers?: string[];
  /**
   * Job names for background-processing (e.g., ["emailQueue",
   * "reportGeneration"])
   */
  jobs?: string[];
}

// ─────────────────────────────────────────────
// Canonical source mapping
// ─────────────────────────────────────────────

export const FIXED_ANALYZE_TEMPLATE_CANONICAL_SOURCE: Record<
  string,
  FixedAnalyzeTemplateCategoryId
> = {
  "domain-concepts": "02-domain-model",
  "error-conditions": "04-business-rules",
  permissions: "01-actors-and-auth",
};

// ─────────────────────────────────────────────
// 6-file template definition
// ─────────────────────────────────────────────

export const FIXED_ANALYZE_TEMPLATE: FixedAnalyzeTemplateFileTemplate[] = [
  // ── 00-toc ──
  {
    categoryId: "00-toc",
    fileId: "00-toc",
    filename: "00-toc.md",
    documentType: "overview",
    description: "Project summary, scope, glossary, and assumptions",
    downstreamPhase: "project-setup",
    forbiddenPatterns: [
      /\bTHE\s+system\s+SHALL\b/i, // EARS requirements belong in 03/04
      /\bTHE\s+system\s+SHOULD\b/i,
    ],
    modules: [
      {
        index: 0,
        title: "Project Summary",
        purpose: "High-level vision, goals, and scope of the project.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "Vision and Goals",
              purposePattern:
                "Define the project vision, business objectives, and success criteria.",
              keywords: [
                "vision",
                "goals",
                "objectives",
                "success-criteria",
                "business-value",
              ],
            },
            {
              titlePattern: "Scope Definition",
              purposePattern:
                "Define what is in-scope and out-of-scope for this project.",
              keywords: [
                "scope",
                "boundaries",
                "in-scope",
                "out-of-scope",
                "constraints",
              ],
            },
          ],
        },
      },
      {
        index: 1,
        title: "Document Map and Canonical Sources",
        purpose:
          "Navigation index and authoritative source declarations for cross-file references.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "Document Map",
              purposePattern:
                "Hyperlinked file index with role summaries and downstream phase mapping.",
              keywords: [
                "document-map",
                "navigation",
                "file-index",
                "hyperlink",
              ],
            },
            {
              titlePattern: "Canonical Source Declaration",
              purposePattern:
                "Declare which file is the authoritative source for each data type and the required reference format.",
              keywords: [
                "canonical-source",
                "reference-format",
                "backtick",
                "yaml-spec",
                "authority",
              ],
            },
          ],
        },
      },
      {
        index: 2,
        title: "Glossary and Assumptions",
        purpose: "Domain terminology definitions and project assumptions.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "Domain Glossary",
              purposePattern:
                "Define domain-specific terms used throughout the documents.",
              keywords: [
                "glossary",
                "terminology",
                "definitions",
                "domain-language",
              ],
            },
            {
              titlePattern: "Assumptions and Constraints",
              purposePattern:
                "List project assumptions and environmental constraints.",
              keywords: [
                "assumptions",
                "constraints",
                "prerequisites",
                "limitations",
              ],
            },
          ],
        },
      },
    ],
  },

  // ── 01-actors-and-auth ──
  {
    categoryId: "01-actors-and-auth",
    fileId: "01-actors-and-auth",
    filename: "01-actors-and-auth.md",
    documentType: "actors-and-auth",
    description:
      "Actor definitions, permission matrix, authentication, session, account lifecycle",
    downstreamPhase: "auth-middleware",
    forbiddenPatterns: [
      /\|\s*(?:type|required|default|constraint)\s*\|/i, // Entity attribute tables → 02
      /```yaml\s*\n\s*entity:/i, // Entity YAML specs → 02
    ],
    yamlSpecs: [],
    modules: [
      {
        index: 0,
        title: "Actor Definitions",
        purpose:
          "Define all user actor types with their roles and what they can do.",
        unitStrategy: {
          type: "perActor",
          unitTemplate: {
            titlePattern: "{name} Actor",
            purposePattern:
              "Define the {name} actor's role and capabilities in business terms.",
            keywords: [
              "actor",
              "role",
              "permissions",
              "capabilities",
              "authorization",
            ],
            requiresYamlSpec: false,
          },
        },
      },
      {
        index: 1,
        title: "Authentication Flows",
        purpose: "Registration, login, session management, and token policies.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "Registration and Login",
              purposePattern:
                "Define user registration and login flows including validation and error handling.",
              keywords: [
                "registration",
                "login",
                "authentication",
                "signup",
                "signin",
              ],
            },
            {
              titlePattern: "Session and Token Policy",
              purposePattern:
                "Define session duration, token refresh, and expiration policies.",
              keywords: ["session", "token", "refresh", "expiration", "jwt"],
            },
          ],
        },
      },
      {
        index: 2,
        title: "Account Lifecycle",
        purpose: "Account state transitions and lifecycle management.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "Account States and Transitions",
              purposePattern:
                "Define account states (active, suspended, deleted) and valid transitions.",
              keywords: [
                "account-state",
                "lifecycle",
                "suspension",
                "deletion",
                "deactivation",
              ],
            },
          ],
        },
      },
    ],
  },

  // ── 02-domain-model ──
  {
    categoryId: "02-domain-model",
    fileId: "02-domain-model",
    filename: "02-domain-model.md",
    documentType: "domain-model",
    description:
      "Business concepts, relationships, and states from user perspective",
    downstreamPhase: "database-design",
    forbiddenPatterns: [
      /\b(?:GET|POST|PUT|PATCH|DELETE)\s+\/\w+/i, // API endpoint defs → 03
      /\bRequest\s+Body\b/i,
      /\bResponse\s+(?:Body|Schema)\b/i,
    ],
    yamlSpecs: [],
    modules: [
      {
        index: 0,
        title: "Domain Concepts",
        purpose: "Describe what each concept means to users and why it exists.",
        unitStrategy: {
          type: "perEntity",
          unitTemplate: {
            titlePattern: "{name} Concept",
            purposePattern:
              "Describe what {name} represents in the business domain, its purpose, and how users interact with it.",
            keywords: [
              "concept",
              "domain",
              "business-meaning",
              "purpose",
              "user-interaction",
            ],
            requiresYamlSpec: false,
          },
        },
      },
      {
        index: 1,
        title: "Domain Relationships",
        purpose:
          "Describe how concepts relate to each other from a business perspective.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "Conceptual Relationships",
              purposePattern:
                "Describe how concepts relate to each other in business terms.",
              keywords: [
                "relationship",
                "association",
                "belongs-to",
                "has-many",
                "ownership",
              ],
            },
            {
              titlePattern: "Lifecycle and Retention",
              purposePattern:
                "Describe business rules for concept lifecycle and data retention from a user perspective.",
              keywords: [
                "lifecycle",
                "retention",
                "archival",
                "deletion-policy",
                "recovery",
              ],
            },
          ],
        },
      },
      {
        index: 2,
        title: "Enums and State Machines",
        purpose: "Enum type definitions and state transitions.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "Enum Definitions",
              purposePattern:
                "Define all enum types with their allowed values and descriptions.",
              keywords: [
                "enum",
                "enumeration",
                "allowed-values",
                "status-type",
              ],
            },
            {
              titlePattern: "State Transitions",
              purposePattern:
                "Define valid state transition paths for stateful concepts.",
              keywords: [
                "state-machine",
                "transition",
                "workflow",
                "status-change",
              ],
            },
          ],
        },
      },
    ],
  },

  // ── 03-functional-requirements ──
  {
    categoryId: "03-functional-requirements",
    fileId: "03-functional-requirements",
    filename: "03-functional-requirements.md",
    documentType: "functional-requirements",
    description:
      "What operations users can perform, use cases, business workflows",
    downstreamPhase: "interface-design",
    forbiddenPatterns: [
      /\b(?:GET|POST|PUT|PATCH|DELETE)\s+\/\w+/i, // API endpoint defs FORBIDDEN in requirements
      /\bHTTP\s+[1-5]\d{2}\b/i, // HTTP status codes FORBIDDEN
      /\bRequest\s+(?:Body|Example)\b/i, // Request schemas FORBIDDEN
      /\bResponse\s+(?:Body|Example|Schema)\b/i, // Response schemas FORBIDDEN
      /```json\s*\n\s*\{/i, // JSON examples FORBIDDEN
      /\b(?:CREATE\s+)?(?:UNIQUE\s+)?INDEX\b/i, // Index defs → 02
      /\bON\s+DELETE\s+(?:CASCADE|SET\s+NULL|RESTRICT)\b/i, // Cascade rules → 02
      /```yaml\s*\n\s*errors:/i, // Error catalog YAML → 04
    ],
    modules: [
      {
        index: 0,
        title: "Core Business Operations",
        purpose: "What the system must do for each business concept.",
        unitStrategy: {
          type: "perEntity",
          unitTemplate: {
            titlePattern: "{name} Operations",
            purposePattern:
              "Define business operations for {name}: what create, read, update, delete, and list operations must accomplish from a business perspective.",
            keywords: [
              "operation",
              "business-logic",
              "use-case",
              "requirement",
              "behavior",
              "functionality",
            ],
          },
        },
      },
      {
        index: 1,
        title: "Business Actions and Workflows",
        purpose: "Business actions and workflows beyond basic CRUD.",
        unitStrategy: {
          type: "perEntityGroup",
          unitTemplate: {
            titlePattern: "{name} Actions",
            purposePattern:
              "Define business actions and workflows for the {name} domain group from a functional requirements perspective.",
            keywords: [
              "action",
              "workflow",
              "business-process",
              "trigger",
              "authentication-flow",
              "authorization",
            ],
          },
        },
      },
      {
        index: 2,
        title: "Error Scenarios and Edge Cases",
        purpose:
          "Business-level error scenarios, edge case coverage, and expected system behaviors for exceptional conditions.",
        unitStrategy: {
          type: "perEntity",
          unitTemplate: {
            titlePattern: "{name} Error Scenarios",
            purposePattern:
              "Define business error conditions, edge cases, and expected system behaviors for all {name} operations.",
            keywords: [
              "error-scenario",
              "edge-case",
              "validation-rule",
              "conflict-resolution",
              "boundary-condition",
            ],
          },
        },
      },
      {
        index: 3,
        title: "End-to-End User Scenarios",
        purpose:
          "Cross-domain user scenarios, multi-step business flows, and end-to-end use cases.",
        unitStrategy: {
          type: "perEntityGroup",
          unitTemplate: {
            titlePattern: "{name} User Scenarios",
            purposePattern:
              "Define end-to-end user scenarios involving {name} and related concepts, describing business flows from the user's perspective.",
            keywords: [
              "user-scenario",
              "use-case",
              "end-to-end",
              "multi-step",
              "cross-domain",
            ],
          },
        },
      },
    ],
  },

  // ── 04-business-rules ──
  {
    categoryId: "04-business-rules",
    fileId: "04-business-rules",
    filename: "04-business-rules.md",
    documentType: "business-rules",
    description:
      "Data isolation, business rules, filtering/sorting/pagination, error catalog",
    downstreamPhase: "service-layer",
    forbiddenPatterns: [
      /```yaml\s*\n\s*entity:/i, // Entity YAML specs → 02
      /\b(?:GET|POST|PUT|PATCH|DELETE)\s+\/\w+/i, // API endpoint defs → 03
    ],
    yamlSpecs: [],
    modules: [
      {
        index: 0,
        title: "Data Isolation and Ownership",
        purpose:
          "Data ownership rules and tenant/user-level isolation policies.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "Ownership and Isolation Rules",
              purposePattern:
                "Define data ownership semantics and isolation boundaries for multi-user access.",
              keywords: [
                "ownership",
                "isolation",
                "tenant",
                "multi-user",
                "data-access",
              ],
            },
          ],
        },
      },
      {
        index: 1,
        title: "Domain Business Rules",
        purpose:
          "Per-concept business rules, validation logic, and domain constraints.",
        unitStrategy: {
          type: "perEntity",
          unitTemplate: {
            titlePattern: "{name} Rules",
            purposePattern:
              "Define business rules, validation logic, and domain constraints for {name}.",
            keywords: [
              "business-rule",
              "validation",
              "constraint",
              "domain-logic",
            ],
          },
        },
      },
      {
        index: 2,
        title: "Detailed Validation Rules",
        purpose:
          "Detailed validation rules with boundary values and format requirements.",
        unitStrategy: {
          type: "perEntity",
          unitTemplate: {
            titlePattern: "{name} Validation Rules",
            purposePattern:
              "Define validation rules for {name}, including boundary values and format requirements.",
            keywords: [
              "validation",
              "boundary-value",
              "format-requirement",
              "sanitization",
            ],
          },
        },
      },
      {
        index: 3,
        title: "Filtering, Sorting, and Pagination",
        purpose:
          "List query specifications for filtering, sorting, and pagination.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "List Query Specifications",
              purposePattern:
                "Define filtering, sorting, and pagination rules for list operations.",
              keywords: [
                "filtering",
                "sorting",
                "pagination",
                "cursor",
                "query",
              ],
            },
          ],
        },
      },
      {
        index: 4,
        title: "Error Conditions",
        purpose: "Business error scenarios and how the system should respond.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "Error Scenarios",
              purposePattern:
                "Describe error conditions and expected system responses in natural language.",
              keywords: [
                "error-scenario",
                "rejection",
                "failure-case",
                "exception",
              ],
              requiresYamlSpec: false,
            },
          ],
        },
      },
    ],
  },

  // ── 05-non-functional ──
  {
    categoryId: "05-non-functional",
    fileId: "05-non-functional",
    filename: "05-non-functional.md",
    documentType: "non-functional",
    description:
      "Performance SLOs, security policies, data integrity, storage requirements",
    downstreamPhase: "test-infra",
    forbiddenPatterns: [
      /\b(?:GET|POST|PUT|PATCH|DELETE)\s+\/\w+/i, // API endpoint defs → 03
      /```yaml\s*\n\s*entity:/i, // Entity YAML specs → 02
    ],
    modules: [
      {
        index: 0,
        title: "Performance Requirements",
        purpose: "Performance SLOs and scalability targets.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "Performance SLOs",
              purposePattern:
                "Define response time targets, throughput limits, and scalability requirements.",
              keywords: [
                "performance",
                "slo",
                "latency",
                "throughput",
                "scalability",
              ],
            },
            {
              titlePattern: "Rate Limiting and Throttling",
              purposePattern:
                "Define rate limiting policies and abuse prevention requirements.",
              keywords: [
                "rate-limit",
                "throttling",
                "abuse-prevention",
                "cooldown",
              ],
            },
          ],
        },
      },
      {
        index: 1,
        title: "Security Requirements",
        purpose: "Security policies, encryption, and compliance requirements.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "Security Policies",
              purposePattern:
                "Define security policies including encryption, input validation, and compliance.",
              keywords: [
                "security",
                "encryption",
                "compliance",
                "input-validation",
                "owasp",
              ],
            },
            {
              titlePattern: "Availability and Reliability",
              purposePattern:
                "Define availability targets, reliability expectations, and failover policies.",
              keywords: [
                "availability",
                "uptime",
                "error-budget",
                "reliability",
              ],
            },
          ],
        },
      },
      {
        index: 2,
        title: "Data Integrity and Storage",
        purpose: "Data integrity constraints and storage requirements.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "Data Integrity and Storage",
              purposePattern:
                "Define backup policies, data retention, and storage tier requirements.",
              keywords: [
                "data-integrity",
                "backup",
                "retention",
                "storage",
                "consistency",
              ],
            },
            {
              titlePattern: "Audit and Observability",
              purposePattern:
                "Define audit logging, monitoring, alerting, and observability requirements.",
              keywords: [
                "audit",
                "logging",
                "monitoring",
                "alerting",
                "observability",
              ],
            },
          ],
        },
      },
      {
        index: 3,
        title: "Concurrency and Data Consistency",
        purpose:
          "Concurrency control policies, race condition handling, and data consistency guarantees.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "Concurrency Control Policies",
              purposePattern:
                "Define optimistic/pessimistic locking strategies, conflict resolution, and retry semantics for concurrent operations.",
              keywords: [
                "concurrency",
                "locking",
                "conflict-resolution",
                "race-condition",
                "retry-semantics",
              ],
            },
            {
              titlePattern: "Data Consistency Guarantees",
              purposePattern:
                "Define consistency models, transactional boundary requirements, and idempotency guarantees.",
              keywords: [
                "consistency",
                "transaction-boundary",
                "atomicity",
                "idempotency",
              ],
            },
          ],
        },
      },
    ],
  },
];

// ─────────────────────────────────────────────
// Conditional modules (activated by features)
// ─────────────────────────────────────────────

export const FIXED_ANALYZE_TEMPLATE_CONDITIONAL_MODULES: Record<
  FixedAnalyzeTemplateFeatureId,
  Array<{
    targetCategory: FixedAnalyzeTemplateCategoryId;
    module: FixedAnalyzeTemplateModuleTemplate;
  }>
> = {
  "real-time": [
    {
      targetCategory: "03-functional-requirements",
      module: {
        index: 100, // appended after base modules
        title: "Real-time Events",
        purpose:
          "WebSocket/SSE event definitions and subscription specifications.",
        unitStrategy: {
          type: "perEntity",
          unitTemplate: {
            titlePattern: "{name} Events",
            purposePattern:
              "Define real-time events for {name} changes, including event payload and subscription rules.",
            keywords: [
              "websocket",
              "sse",
              "event",
              "subscription",
              "real-time",
            ],
          },
        },
      },
    },
    {
      targetCategory: "05-non-functional",
      module: {
        index: 100,
        title: "Real-time Communication",
        purpose:
          "WebSocket/SSE connection policies and performance requirements.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "WebSocket Security and Performance",
              purposePattern:
                "Define connection limits, heartbeat intervals, reconnection policies, and security requirements for real-time communication.",
              keywords: [
                "websocket-security",
                "connection-limit",
                "heartbeat",
                "reconnection",
              ],
            },
          ],
        },
      },
    },
  ],
  "external-integration": [
    {
      targetCategory: "03-functional-requirements",
      module: {
        index: 101,
        title: "External Integrations",
        purpose:
          "Third-party API contracts, webhook handlers, and integration specifications.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "Integration Contracts",
              purposePattern:
                "Define external API dependencies, authentication methods, request/response formats, and error handling for third-party integrations.",
              keywords: [
                "integration",
                "third-party",
                "webhook",
                "oauth-provider",
                "payment",
              ],
            },
          ],
        },
      },
    },
    {
      targetCategory: "04-business-rules",
      module: {
        index: 100,
        title: "Integration Error Handling",
        purpose: "Error handling and retry policies for external integrations.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "Integration Failure Policies",
              purposePattern:
                "Define retry strategies, circuit breaker policies, fallback behavior, and error escalation for external service failures.",
              keywords: [
                "retry",
                "circuit-breaker",
                "fallback",
                "integration-error",
              ],
            },
          ],
        },
      },
    },
    {
      targetCategory: "05-non-functional",
      module: {
        index: 101,
        title: "External Dependency SLOs",
        purpose:
          "Service level objectives for external dependency availability.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "External Dependency SLOs",
              purposePattern:
                "Define availability expectations, timeout thresholds, and degradation policies for external service dependencies.",
              keywords: [
                "dependency-slo",
                "timeout",
                "degradation",
                "external-availability",
              ],
            },
          ],
        },
      },
    },
  ],
  "background-processing": [
    {
      targetCategory: "03-functional-requirements",
      module: {
        index: 102,
        title: "Background Processing",
        purpose:
          "Asynchronous job definitions, queue specifications, and scheduled task configurations.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "Job Specifications",
              purposePattern:
                "Define background jobs, queue configurations, retry policies, and scheduling rules for asynchronous processing.",
              keywords: [
                "background-job",
                "queue",
                "cron",
                "async",
                "scheduled-task",
              ],
            },
          ],
        },
      },
    },
    {
      targetCategory: "04-business-rules",
      module: {
        index: 101,
        title: "Job Failure Policies",
        purpose:
          "Failure handling and dead-letter queue policies for background jobs.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "Job Failure and Recovery",
              purposePattern:
                "Define failure handling, recovery procedures, and notification requirements for background jobs.",
              keywords: ["job-failure", "retry", "recovery", "notification"],
            },
          ],
        },
      },
    },
    {
      targetCategory: "05-non-functional",
      module: {
        index: 102,
        title: "Queue Performance",
        purpose:
          "Performance requirements for message queues and background processing.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "Queue Performance SLOs",
              purposePattern:
                "Define performance requirements for background job processing.",
              keywords: ["queue-throughput", "processing-latency"],
            },
          ],
        },
      },
    },
  ],
  "file-storage": [
    {
      targetCategory: "03-functional-requirements",
      module: {
        index: 103,
        title: "File Storage",
        purpose:
          "File upload capabilities, media processing, and storage requirements.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "File Upload and Management",
              purposePattern:
                "Define file upload capabilities, supported formats, processing requirements, and access control for stored files.",
              keywords: ["file-upload", "media", "storage", "attachment"],
            },
          ],
        },
      },
    },
    {
      targetCategory: "04-business-rules",
      module: {
        index: 102,
        title: "File Validation Rules",
        purpose: "Validation rules and policies for file uploads and storage.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "File Validation and Policies",
              purposePattern:
                "Define file type restrictions, virus scanning requirements, content validation, and retention policies for uploaded files.",
              keywords: [
                "file-validation",
                "virus-scan",
                "content-type",
                "retention",
              ],
            },
          ],
        },
      },
    },
    {
      targetCategory: "05-non-functional",
      module: {
        index: 103,
        title: "Storage Capacity",
        purpose: "Storage capacity planning and CDN requirements.",
        unitStrategy: {
          type: "fixed",
          units: [
            {
              titlePattern: "Storage Capacity Requirements",
              purposePattern:
                "Define storage requirements and capacity planning for file storage.",
              keywords: ["storage-capacity", "cdn", "capacity"],
            },
          ],
        },
      },
    },
  ],
};

// ─────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────

/**
 * Expand a module's unit strategy into concrete unit templates based on the
 * domain's entities and actors.
 */
export const expandFixedAnalyzeTemplateUnits = (
  module: FixedAnalyzeTemplateModuleTemplate,
  entities: Array<{ name: string }>,
  actors: Array<{ name: string }>,
): FixedAnalyzeTemplateUnitTemplate[] => {
  const strategy = module.unitStrategy;
  switch (strategy.type) {
    case "fixed":
      return strategy.units;
    case "perEntity":
      return entities.map((e) => ({
        titlePattern: strategy.unitTemplate.titlePattern.replace(
          "{name}",
          e.name,
        ),
        purposePattern: strategy.unitTemplate.purposePattern.replace(
          "{name}",
          e.name,
        ),
        keywords: [...strategy.unitTemplate.keywords, e.name.toLowerCase()],
        requiresYamlSpec: strategy.unitTemplate.requiresYamlSpec,
      }));
    case "perActor":
      return actors.map((a) => ({
        titlePattern: strategy.unitTemplate.titlePattern.replace(
          "{name}",
          a.name,
        ),
        purposePattern: strategy.unitTemplate.purposePattern.replace(
          "{name}",
          a.name,
        ),
        keywords: [...strategy.unitTemplate.keywords, a.name.toLowerCase()],
        requiresYamlSpec: strategy.unitTemplate.requiresYamlSpec,
      }));
    case "perEntityGroup":
      // For now, entity groups = entities; can be refined later
      return entities.map((e) => ({
        titlePattern: strategy.unitTemplate.titlePattern.replace(
          "{name}",
          e.name,
        ),
        purposePattern: strategy.unitTemplate.purposePattern.replace(
          "{name}",
          e.name,
        ),
        keywords: [...strategy.unitTemplate.keywords, e.name.toLowerCase()],
        requiresYamlSpec: strategy.unitTemplate.requiresYamlSpec,
      }));
  }
};

/**
 * Build an expanded template by merging base TEMPLATE with conditional modules
 * activated by the given features.
 *
 * Module indices are renumbered sequentially per file after merging.
 */
export const buildFixedAnalyzeExpandedTemplate = (
  features: FixedAnalyzeTemplateFeature[],
): FixedAnalyzeTemplateFileTemplate[] => {
  if (features.length === 0) return FIXED_ANALYZE_TEMPLATE;

  const activeFeatureIds = new Set(features.map((f) => f.id));
  const extraModules = new Map<
    FixedAnalyzeTemplateCategoryId,
    FixedAnalyzeTemplateModuleTemplate[]
  >();

  for (const featureId of activeFeatureIds) {
    const conditionals = FIXED_ANALYZE_TEMPLATE_CONDITIONAL_MODULES[featureId];
    for (const { targetCategory, module } of conditionals) {
      const existing = extraModules.get(targetCategory) ?? [];
      existing.push(module);
      extraModules.set(targetCategory, existing);
    }
  }

  return FIXED_ANALYZE_TEMPLATE.map((fileTemplate) => {
    const extras = extraModules.get(fileTemplate.categoryId);
    if (!extras || extras.length === 0) return fileTemplate;

    const mergedModules = [...fileTemplate.modules, ...extras].map((m, i) => ({
      ...m,
      index: i,
    }));

    return { ...fileTemplate, modules: mergedModules };
  });
};

/**
 * Generate AutoBeAnalyzeFile.Scenario objects from the fixed template,
 * optionally expanded with conditional modules based on features. Called after
 * LLM returns actors/entities/features in the scenario phase.
 */
export const buildFixedAnalyzeScenarioFiles = (
  _prefix: string,
  features: FixedAnalyzeTemplateFeature[] = [],
): AutoBeAnalyzeFileScenario[] =>
  buildFixedAnalyzeExpandedTemplate(features).map((t) => ({
    reason: `Fixed SRS structure: ${t.description}`,
    filename: t.filename,
    documentType: t.documentType,
    outline: t.modules.map((m) => m.title),
    audience: "general",
    detailLevel: "detailed specification",
    constraints: [
      `File scope: ${t.description}`,
      `Downstream phase: ${t.downstreamPhase}`,
    ],
  }));

/** Deterministically generate the Document Map unit content for 00-toc. */
export const buildFixedAnalyzeDocumentMapContent = (
  files: FixedAnalyzeTemplateFileTemplate[],
): string => {
  const rows = files
    .map(
      (f) =>
        `| [${f.filename}](./${f.filename}) | ${f.description} | ${f.downstreamPhase} |`,
    )
    .join("\n");
  return `| File | Role | Downstream |\n|------|------|------------|\n${rows}`;
};

/** Deterministically generate the Canonical Source Declaration unit content. */
export const buildFixedAnalyzeCanonicalSourceContent = (): string => {
  const header = `Each type of information has one authoritative location. Other files should reference these canonical sources.\n`;
  const table = [
    "| Information Type | Canonical File |",
    "|------------------|---------------|",
    "| Domain concepts | [02-domain-model.md](./02-domain-model.md) |",
    "| Error conditions | [04-business-rules.md](./04-business-rules.md) |",
    "| Permissions | [01-actors-and-auth.md](./01-actors-and-auth.md) |",
    "| Actor definitions | [01-actors-and-auth.md](./01-actors-and-auth.md) |",
  ].join("\n");
  return `${header}\n${table}`;
};
