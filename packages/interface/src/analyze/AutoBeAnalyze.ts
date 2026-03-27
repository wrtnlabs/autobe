import { tags } from "typia";

import { CamelCasePattern } from "../typings/CamelCasePattern";

/**
 * AST types for the requirements analysis (Analyze) phase.
 *
 * Document hierarchy: IFile → IModule (#) → IUnit (##) → ISection (###). IActor
 * defines authenticated user types used for auth and access control.
 */
export namespace AutoBeAnalyze {
  /** An authenticated user type used for authorization throughout the app. */
  export interface IActor {
    /** MUST use camelCase. Referenced in schema models and auth decorators. */
    name: string & CamelCasePattern & tags.MinLength<1>;

    /**
     * Permission level:
     *
     * - "guest": Unauthenticated, limited to public resources.
     * - "member": Authenticated with standard access.
     * - "admin": Elevated permissions, can manage users and system settings.
     */
    kind: "guest" | "member" | "admin";

    /** Description of this actor's permissions and capabilities. */
    description: string;
  }

  /** Planning context for a document to be generated. {@link IFile} extends this. */
  export interface IFileScenario {
    /** Why this document is being created and what comes next. */
    reason: string;

    /** Filename to generate or overwrite (e.g., "01-service-overview.md"). */
    filename: `${string}.md`;

    /** Document type (e.g., "requirement", "user-story", "business-model"). */
    documentType?: string;

    /** Table of contents guiding the document structure. */
    outline?: string[];

    /**
     * Target audience (e.g., "development team", "business stakeholders").
     * Defaults to general audience.
     */
    audience?: string;

    /** Key questions this document should answer. */
    keyQuestions?: string[];

    /** Level of detail (e.g., "high-level overview", "detailed specification"). */
    detailLevel?: string;

    /** Related documents this one references or builds upon. */
    relatedDocuments?: string[];

    /** Must-have constraints the document must satisfy. */
    constraints?: string[];
  }

  /** Planning document structure for the Analyze phase. */
  export interface IFile extends IFileScenario {
    /** Document title. */
    title: string;

    /** Executive summary of the document. */
    summary: string;

    /**
     * Markdown file content. Must be a standalone deliverable.
     *
     * PROHIBITED: questions to the reader, feedback requests, interactive
     * elements, or meta-commentary about the writing process.
     */
    content: string;

    /**
     * Hierarchical content structure (Module -> Unit -> Section). Preserves the
     * three-level hierarchy that flat markdown loses.
     */
    module: IModule;
  }

  /** Module (# level) in the document hierarchy. */
  export interface IModule {
    /** Title of the module (# level heading). */
    title: string;

    /** Purpose of this module within the document. */
    purpose: string;

    /** Introductory content before any units. */
    content: string;

    /** Units (## level) within this module. */
    units: IUnit[];
  }

  /** Unit (## level) within a module. */
  export interface IUnit {
    /** Title of the unit (## level heading). */
    title: string;

    /** Purpose of this unit within its module. */
    purpose: string;

    /** Body content before any sections. */
    content: string;

    /** Semantic keywords for search and categorization. */
    keywords: string[];

    /** Sections (### level) within this unit. */
    sections: ISection[];
  }

  /** Section (### level) within a unit. */
  export interface ISection {
    /** Title of the section (### level heading). */
    title: string;

    /** Detailed content. Use EARS format for requirements, Mermaid for diagrams. */
    content: string;
  }
}
