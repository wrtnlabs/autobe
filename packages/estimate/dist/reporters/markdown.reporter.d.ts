import type { EvaluationResult } from '../types';
import type { AgentResult } from '../agents';
interface ExtendedResult extends EvaluationResult {
    agentEvaluations?: AgentResult[];
}
export declare function generateMarkdownReport(result: ExtendedResult): string;
export {};
//# sourceMappingURL=markdown.reporter.d.ts.map