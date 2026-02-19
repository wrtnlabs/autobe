"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMQualityAgent = void 0;
const base_agent_1 = require("./base-agent");
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
/**
 * LLM Quality evaluation agent
 */
class LLMQualityAgent extends base_agent_1.BaseAgent {
    name = 'LLMQualityAgent';
    description = 'Evaluates AI-generated code for common LLM mistakes';
    constructor(config) {
        super(config);
    }
    async evaluate(context) {
        const startTime = performance.now();
        const targetFiles = context.files.providers;
        if (targetFiles.length === 0) {
            return {
                agent: this.name,
                provider: this.config.provider,
                model: this.client.getModel(),
                issues: [],
                score: 100,
                summary: 'No files to evaluate',
                durationMs: Math.round(performance.now() - startTime),
            };
        }
        let requirementsContent = '';
        if (context.project.analysisDir) {
            try {
                const files = await fs.readdir(context.project.analysisDir);
                for (const file of files.slice(0, 5)) {
                    if (file.endsWith('.md')) {
                        const content = await fs.readFile(path.join(context.project.analysisDir, file), 'utf-8');
                        requirementsContent += `\n### ${file}\n${content}\n`;
                    }
                }
            }
            catch (error) {
                console.error('Failed to read requirements:', error);
            }
        }
        const fileContents = await this.readFiles(targetFiles);
        let codeContent = '';
        for (const [filePath, content] of fileContents) {
            const relativePath = path.relative(context.project.rootPath, filePath);
            codeContent += `\n### File: ${relativePath}\n\`\`\`typescript\n${content}\n\`\`\`\n`;
        }
        requirementsContent = this.truncateContent(requirementsContent, 20000);
        codeContent = this.truncateContent(codeContent, 30000);
        const systemPrompt = await this.loadPrompt('LLM_QUALITY_AGENT.md');
        const userPrompt = `Analyze this AI-generated code:
${requirementsContent ? `\n## Requirements\n${requirementsContent}\n` : ''}
## Code
${codeContent}

Respond ONLY with valid JSON.`;
        try {
            const response = await this.client.chat(systemPrompt, userPrompt);
            const parsed = this.parseResponse(response.content);
            return {
                agent: this.name,
                provider: this.config.provider,
                model: this.client.getModel(),
                issues: parsed.issues,
                score: parsed.score,
                summary: parsed.summary,
                durationMs: Math.round(performance.now() - startTime),
                tokensUsed: response.tokensUsed,
            };
        }
        catch (error) {
            console.error('LLMQualityAgent error:', error);
            return {
                agent: this.name,
                provider: this.config.provider,
                model: this.client.getModel(),
                issues: [],
                score: 100,
                summary: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                durationMs: Math.round(performance.now() - startTime),
            };
        }
    }
}
exports.LLMQualityAgent = LLMQualityAgent;
//# sourceMappingURL=llm-quality-agent.js.map