import { EvaluationContext } from "../types";
import { BaseAgent } from "./base-agent";
import { AgentConfig, AgentResult } from "./types";
/** Security evaluation agent */
export declare class SecurityAgent extends BaseAgent {
    readonly name = "SecurityAgent";
    readonly description = "Evaluates code for security vulnerabilities";
    constructor(config: AgentConfig);
    evaluate(context: EvaluationContext): Promise<AgentResult>;
}
//# sourceMappingURL=security-agent.d.ts.map