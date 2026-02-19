/**
 * Issue severity levels
 */
export type Severity = 'critical' | 'warning' | 'suggestion';
/**
 * Issue categories
 */
export type IssueCategory = 'syntax' | 'syntax-error' | 'type-error' | 'prisma' | 'prisma-error' | 'complexity' | 'naming' | 'jsdoc' | 'duplication' | 'security' | 'error-handling' | 'validation' | 'hallucination' | 'todo-left' | 'incomplete' | 'test' | 'requirements' | 'documentation' | 'api' | 'completeness';
/**
 * Source location
 */
export interface SourceLocation {
    file: string;
    line?: number;
    column?: number;
}
/**
 * Issue definition
 */
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
/**
 * Create issue helper
 */
export declare function createIssue(partial: Omit<Issue, 'id' | 'autoFixable'> & {
    id?: string;
    autoFixable?: boolean;
}): Issue;
//# sourceMappingURL=issue.d.ts.map