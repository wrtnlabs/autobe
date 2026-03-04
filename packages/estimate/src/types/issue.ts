/** Issue severity levels */
export type Severity = "critical" | "warning" | "suggestion";

/** Issue categories */
export type IssueCategory =
  // Gate
  | "syntax"
  | "syntax-error"
  | "type-error"
  | "prisma"
  | "prisma-error"
  // Quality
  | "complexity"
  | "naming"
  | "jsdoc"
  | "duplication"
  // Safety
  | "security"
  | "error-handling"
  | "validation"
  // LLM Specific
  | "hallucination"
  | "todo-left"
  | "incomplete"
  // Functionality
  | "test"
  | "requirements"
  // New scoring categories
  | "documentation"
  | "api"
  | "completeness"
  | "runtime";

/** Source location */
export interface SourceLocation {
  file: string;
  line?: number;
  column?: number;
}

/** Issue definition */
export interface Issue {
  id: string;
  severity: Severity;
  category: IssueCategory;
  code: string;
  message: string;
  location?: SourceLocation;
  suggestion?: string;
  autoFixable: boolean;
  docsUrl?: string;
}

/** Partial input for creating an issue */
export type CreateIssueInput = Omit<Issue, "id" | "autoFixable"> & {
  id?: string;
  autoFixable?: boolean;
};

/** Create issue helper */
export function createIssue(partial: CreateIssueInput): Issue {
  return {
    ...partial,
    id:
      partial.id ??
      `${partial.category}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    autoFixable: partial.autoFixable ?? false,
  };
}
