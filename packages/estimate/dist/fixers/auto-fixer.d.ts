import type { Issue } from "../types";
interface FixResult {
    file: string;
    code: string;
    fixed: boolean;
    description: string;
}
export declare class AutoFixer {
    private verbose;
    constructor(verbose?: boolean);
    fix(issues: Issue[]): Promise<FixResult[]>;
    private canFix;
    private applyFix;
    private fixUnterminatedRegex;
    private fixImplicitAny;
    getSummary(results: FixResult[]): string;
}
export {};
//# sourceMappingURL=auto-fixer.d.ts.map