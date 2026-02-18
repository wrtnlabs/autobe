import { BaseAgent } from './base-agent';
import { AgentConfig, AgentResult } from './types';
import { EvaluationContext } from '../types';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * LLM Quality evaluation agent
 */
export class LLMQualityAgent extends BaseAgent {
  readonly name = 'LLMQualityAgent';
  readonly description = 'Evaluates AI-generated code for common LLM mistakes';

  constructor(config: AgentConfig) {
    super(config);
  }

  async evaluate(context: EvaluationContext): Promise<AgentResult> {
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
            const content = await fs.readFile(
              path.join(context.project.analysisDir, file),
              'utf-8'
            );
            requirementsContent += `\n### ${file}\n${content}\n`;
          }
        }
      } catch (error) {
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
    } catch (error) {
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
