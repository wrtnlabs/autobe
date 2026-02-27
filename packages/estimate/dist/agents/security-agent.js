"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityAgent = void 0;
const base_agent_1 = require("./base-agent");
/** Security evaluation agent */
class SecurityAgent extends base_agent_1.BaseAgent {
    name = "SecurityAgent";
    description = "Evaluates code for security vulnerabilities";
    constructor(config) {
        super(config);
    }
    async evaluate(context) {
        const startTime = performance.now();
        const targetFiles = [
            ...context.files.controllers,
            ...context.files.providers,
        ];
        if (targetFiles.length === 0) {
            return {
                agent: this.name,
                provider: this.config.provider,
                model: this.client.getModel(),
                issues: [],
                score: 100,
                summary: "No files to evaluate",
                durationMs: Math.round(performance.now() - startTime),
            };
        }
        const fileContents = await this.readFiles(targetFiles);
        const chunks = this.splitIntoChunks(fileContents, context.project.rootPath, 80000);
        console.log(`  ${this.name}: ${targetFiles.length} files → ${chunks.length} chunk(s)`);
        const systemPrompt = await this.loadPrompt("SECURITY_AGENT.md");
        const { parsed, tokensUsed } = await this.evaluateChunks(systemPrompt, chunks, (chunk, index, total) => total > 1
            ? `Analyze this TypeScript/NestJS code for security vulnerabilities (chunk ${index}/${total}):\n\n${chunk}\n\nRespond ONLY with valid JSON.`
            : `Analyze this TypeScript/NestJS code for security vulnerabilities:\n\n${chunk}\n\nRespond ONLY with valid JSON.`);
        return {
            agent: this.name,
            provider: this.config.provider,
            model: this.client.getModel(),
            issues: parsed.issues,
            score: parsed.score,
            summary: parsed.summary,
            durationMs: Math.round(performance.now() - startTime),
            tokensUsed,
        };
    }
}
exports.SecurityAgent = SecurityAgent;
//# sourceMappingURL=security-agent.js.map