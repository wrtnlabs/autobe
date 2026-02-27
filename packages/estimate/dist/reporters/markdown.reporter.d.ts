import type { AgentResult } from "../agents";
import type { EvaluationResult } from "../types";
interface ExtendedResult extends EvaluationResult {
    agentEvaluations?: AgentResult[];
}
export declare function generateMarkdownReport(result: ExtendedResult): string;
export {};
//# sourceMappingURL=markdown.reporter.d.ts.map