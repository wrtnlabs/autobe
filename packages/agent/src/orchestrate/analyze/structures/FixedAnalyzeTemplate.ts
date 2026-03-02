import { AutoBeAnalyzeFile } from "@autobe/interface";

/**
 * Fixed 6-category SRS document structure template.
 *
 * Defines the authoritative structure for all analysis documents.
 * LLM is no longer responsible for deciding file count, file names,
 * or module/unit layout. Instead, it focuses solely on content generation
 * within this fixed skeleton.
 *
 * Hierarchy: Category (file) → Module (#) → Unit (##) → Section (###)
 *
 * @author Juntak
 */
export namespace FixedAnalyzeTemplate {
  // ─────────────────────────────────────────────
  // Types
  // ─────────────────────────────────────────────

  export type CategoryId =
    | "00-overview"
    | "01-actors-and-auth"
    | "02-domain-model"
    | "03-functional-requirements"
    | "04-business-rules"
    | "05-non-functional";

  export interface IFileTemplate {
    categoryId: CategoryId;
    /** Currently equals categoryId; reserved for future per-category splits. */
    fileId: string;
    filename: `${string}.md`;
    documentType: string;
    description: string;
    downstreamPhase: string;
    modules: IModuleTemplate[];
    /** Regex patterns that must NOT appear in this file's sections. */
    forbiddenPatterns: RegExp[];
    /** YAML spec block definitions for canonical files (01/02/04). */
    yamlSpecs?: IYamlSpecDefinition[];
  }

  export interface IYamlSpecDefinition {
    /** Root key of the YAML block (e.g., "entity", "errors", "permissions"). */
    rootKey: string;
    /** Module index where this YAML block lives. */
    moduleIndex: number;
    /** Registry type this YAML feeds into. */
    registryType: "entity-attributes" | "error-codes" | "permissions";
  }

  export interface IModuleTemplate {
    index: number;
    title: string;
    purpose: string;
    unitStrategy: IUnitStrategy;
  }

  export type IUnitStrategy =
    | IFixedUnits
    | IPerEntityUnits
    | IPerActorUnits
    | IPerEntityGroupUnits;

  export interface IFixedUnits {
    type: "fixed";
    units: IUnitTemplate[];
  }
  export interface IPerEntityUnits {
    type: "perEntity";
    unitTemplate: IUnitTemplate;
  }
  export interface IPerActorUnits {
    type: "perActor";
    unitTemplate: IUnitTemplate;
  }
  export interface IPerEntityGroupUnits {
    type: "perEntityGroup";
    unitTemplate: IUnitTemplate;
  }

  export interface IUnitTemplate {
    titlePattern: string;
    purposePattern: string;
    keywords: string[];
    /** Whether this unit must contain a canonical YAML spec block. */
    requiresYamlSpec?: boolean;
  }

  // ─────────────────────────────────────────────
  // Canonical source mapping
  // ─────────────────────────────────────────────

  export const CANONICAL_SOURCE: Record<string, CategoryId> = {
    "entity-attributes": "02-domain-model",
    "error-codes": "04-business-rules",
    permissions: "01-actors-and-auth",
  };

  // ─────────────────────────────────────────────
  // 6-file template definition
  // ─────────────────────────────────────────────

  export const TEMPLATE: IFileTemplate[] = [
    // ── 00-overview ──
    {
      categoryId: "00-overview",
      fileId: "00-overview",
      filename: "00-overview.md",
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
          purpose:
            "High-level vision, goals, and scope of the project.",
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
          purpose:
            "Domain terminology definitions and project assumptions.",
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
      yamlSpecs: [
        {
          rootKey: "permissions",
          moduleIndex: 0,
          registryType: "permissions",
        },
      ],
      modules: [
        {
          index: 0,
          title: "Actor Definitions",
          purpose:
            "Define all user actor types with their permissions and capabilities.",
          unitStrategy: {
            type: "perActor",
            unitTemplate: {
              titlePattern: "{name} Actor",
              purposePattern:
                "Define the {name} actor's role, permissions, and capabilities.",
              keywords: [
                "actor",
                "role",
                "permissions",
                "capabilities",
                "authorization",
              ],
              requiresYamlSpec: true,
            },
          },
        },
        {
          index: 1,
          title: "Authentication Flows",
          purpose:
            "Registration, login, session management, and token policies.",
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
                keywords: [
                  "session",
                  "token",
                  "refresh",
                  "expiration",
                  "jwt",
                ],
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
        "Entity definitions, relationships, indexes, cascade rules, state machines, enums",
      downstreamPhase: "prisma-schema",
      forbiddenPatterns: [
        /\b(?:GET|POST|PUT|PATCH|DELETE)\s+\/\w+/i, // API endpoint defs → 03
        /\bRequest\s+Body\b/i,
        /\bResponse\s+(?:Body|Schema)\b/i,
      ],
      yamlSpecs: [
        {
          rootKey: "entity",
          moduleIndex: 0,
          registryType: "entity-attributes",
        },
      ],
      modules: [
        {
          index: 0,
          title: "Entity Definitions",
          purpose:
            "Define all domain entities with their attributes, types, and constraints.",
          unitStrategy: {
            type: "perEntity",
            unitTemplate: {
              titlePattern: "{name} Entity",
              purposePattern:
                "Define the {name} entity's attributes, constraints, and validation rules.",
              keywords: [
                "entity",
                "attributes",
                "constraints",
                "validation",
                "schema",
              ],
              requiresYamlSpec: true,
            },
          },
        },
        {
          index: 1,
          title: "Entity Relationships and Integrity",
          purpose:
            "Define relationships between entities and data integrity rules.",
          unitStrategy: {
            type: "fixed",
            units: [
              {
                titlePattern: "Relationship Map",
                purposePattern:
                  "Define all entity relationships (1:1, 1:N, M:N) with foreign key mappings.",
                keywords: [
                  "relationship",
                  "foreign-key",
                  "one-to-many",
                  "many-to-many",
                  "association",
                ],
              },
              {
                titlePattern: "Cascading and Integrity Rules",
                purposePattern:
                  "Define cascade delete/update rules and referential integrity constraints.",
                keywords: [
                  "cascade",
                  "integrity",
                  "on-delete",
                  "on-update",
                  "orphan",
                ],
              },
            ],
          },
        },
        {
          index: 2,
          title: "Enums and State Machines",
          purpose: "Enum type definitions and entity state transitions.",
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
                  "Define valid state transition paths for stateful entities.",
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
        "API endpoints, per-entity CRUD operations, request/response specifications",
      downstreamPhase: "openapi-controllers",
      forbiddenPatterns: [
        /\b(?:CREATE\s+)?(?:UNIQUE\s+)?INDEX\b/i, // Index defs → 02
        /\bON\s+DELETE\s+(?:CASCADE|SET\s+NULL|RESTRICT)\b/i, // Cascade rules → 02
        /```yaml\s*\n\s*errors:/i, // Error catalog YAML → 04
      ],
      modules: [
        {
          index: 0,
          title: "CRUD Operations",
          purpose:
            "Per-entity CRUD endpoint specifications with request/response schemas.",
          unitStrategy: {
            type: "perEntity",
            unitTemplate: {
              titlePattern: "{name} Operations",
              purposePattern:
                "Define CRUD endpoints for {name}: create, read, update, delete, and list operations.",
              keywords: [
                "crud",
                "endpoint",
                "api",
                "request",
                "response",
                "http",
              ],
            },
          },
        },
        {
          index: 1,
          title: "Action Endpoints",
          purpose:
            "Non-CRUD action endpoints grouped by domain concern.",
          unitStrategy: {
            type: "perEntityGroup",
            unitTemplate: {
              titlePattern: "{name} Actions",
              purposePattern:
                "Define non-CRUD action endpoints for the {name} domain group.",
              keywords: [
                "action",
                "endpoint",
                "workflow",
                "operation",
                "trigger",
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
        "Data isolation, entity business rules, filtering/sorting/pagination, error catalog",
      downstreamPhase: "service-layer",
      forbiddenPatterns: [
        /```yaml\s*\n\s*entity:/i, // Entity YAML specs → 02
        /\b(?:GET|POST|PUT|PATCH|DELETE)\s+\/\w+/i, // API endpoint defs → 03
      ],
      yamlSpecs: [
        {
          rootKey: "errors",
          moduleIndex: 3,
          registryType: "error-codes",
        },
      ],
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
          title: "Entity Business Rules",
          purpose:
            "Per-entity business rules, validation logic, and domain constraints.",
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
          title: "Filtering, Sorting, and Pagination",
          purpose:
            "List query specifications for filtering, sorting, and pagination.",
          unitStrategy: {
            type: "fixed",
            units: [
              {
                titlePattern: "List Query Specifications",
                purposePattern:
                  "Define filtering, sorting, and pagination rules for list endpoints.",
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
          index: 3,
          title: "Error Catalog",
          purpose:
            "Centralized error code definitions with HTTP status mappings.",
          unitStrategy: {
            type: "fixed",
            units: [
              {
                titlePattern: "Error Code Catalog",
                purposePattern:
                  "Define all error codes with HTTP status, condition, and resolution guidance.",
                keywords: [
                  "error-code",
                  "http-status",
                  "error-catalog",
                  "exception",
                ],
                requiresYamlSpec: true,
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
                  "Define per-IP and per-user rate limits, throttling policies, and abuse prevention thresholds.",
                keywords: [
                  "rate-limit",
                  "throttling",
                  "abuse-prevention",
                  "ip-limit",
                  "cooldown",
                ],
              },
            ],
          },
        },
        {
          index: 1,
          title: "Security Requirements",
          purpose:
            "Security policies, encryption, and compliance requirements.",
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
                  "Define uptime targets, error rate budgets, concurrent session limits, and failover policies.",
                keywords: [
                  "availability",
                  "uptime",
                  "error-budget",
                  "session-limit",
                  "reliability",
                ],
              },
            ],
          },
        },
        {
          index: 2,
          title: "Data Integrity and Storage",
          purpose:
            "Data integrity constraints and storage requirements.",
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
      ],
    },
  ];

  // ─────────────────────────────────────────────
  // Helper functions
  // ─────────────────────────────────────────────

  /**
   * Expand a module's unit strategy into concrete unit templates
   * based on the domain's entities and actors.
   */
  export const expandUnits = (
    module: IModuleTemplate,
    entities: Array<{ name: string }>,
    actors: Array<{ name: string }>,
  ): IUnitTemplate[] => {
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
   * Generate AutoBeAnalyzeFile.Scenario objects from the fixed template.
   * Called after LLM returns actors/entities in the scenario phase.
   */
  export const buildScenarioFiles = (
    _prefix: string,
  ): AutoBeAnalyzeFile.Scenario[] =>
    TEMPLATE.map((t) => ({
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

  /**
   * Deterministically generate the Document Map unit content for 00-overview.
   */
  export const buildDocumentMapContent = (
    files: IFileTemplate[],
  ): string => {
    const rows = files
      .map(
        (f) =>
          `| [${f.filename}](./${f.filename}) | ${f.description} | ${f.downstreamPhase} |`,
      )
      .join("\n");
    return `| File | Role | Downstream |\n|------|------|------------|\n${rows}`;
  };

  /**
   * Deterministically generate the Canonical Source Declaration unit content.
   */
  export const buildCanonicalSourceContent = (): string => {
    const header = `Other files MUST reference canonical definitions using the backtick format below.\nPlain-text mentions of the same terms are NOT treated as references.\n`;
    const table = [
      "| Data Type | Canonical File | Reference Format |",
      "|-----------|---------------|-----------------|",
      "| Entity attributes | [02-domain-model.md](./02-domain-model.md) | \\`Entity.field\\` |",
      "| Error codes | [04-business-rules.md](./04-business-rules.md) | \\`ERROR_CODE\\` |",
      "| Permissions | [01-actors-and-auth.md](./01-actors-and-auth.md) | \\`actor:resource:action\\` |",
      "| Actor definitions | [01-actors-and-auth.md](./01-actors-and-auth.md) | \\`ActorName\\` |",
      "| Enum values | [02-domain-model.md](./02-domain-model.md) | \\`EnumName.VALUE\\` |",
    ].join("\n");
    return `${header}\n${table}`;
  };
}
