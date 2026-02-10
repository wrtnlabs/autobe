import { BaseAgent } from './base-agent';
import { AgentConfig, AgentResult } from './types';
import { EvaluationContext } from '../types';
import * as path from 'path';

/**
 * Security evaluation agent
 */
export class SecurityAgent extends BaseAgent {
  readonly name = 'SecurityAgent';
  readonly description = 'Evaluates code for security vulnerabilities';

  constructor(config: AgentConfig) {
    super(config);
  }

  async evaluate(context: EvaluationContext): Promise<AgentResult> {
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
        summary: 'No files to evaluate',
        durationMs: Math.round(performance.now() - startTime),
      };
    }

    const fileContents = await this.readFiles(targetFiles);

    let codeContent = '';
    for (const [filePath, content] of fileContents) {
      const relativePath = path.relative(context.project.rootPath, filePath);
      codeContent += `\n### File: ${relativePath}\n\`\`\`typescript\n${content}\n\`\`\`\n`;
    }

    codeContent = this.truncateContent(codeContent);

    const systemPrompt = `You are a security expert specializing in TypeScript and NestJS applications.
Analyze code for security vulnerabilities.

Focus on:
1. SQL Injection
2. XSS (Cross-Site Scripting)
3. Authentication/Authorization issues
4. Sensitive Data Exposure
5. Input Validation
6. Insecure Dependencies (eval, Function constructor)
7. Path Traversal
8. CORS Issues

Respond ONLY with valid JSON:
{
  "issues": [
    {
      "severity": "critical|warning|suggestion",
      "type": "sql-injection|xss|auth|sensitive-data|validation|insecure-code|path-traversal|cors",
      "file": "relative/path/to/file.ts",
      "line": 42,
      "description": "Clear description",
      "suggestion": "How to fix"
    }
  ],
  "score": 85,
  "summary": "Brief assessment"
}`;

    const userPrompt = `Analyze this TypeScript/NestJS code for security vulnerabilities:\n\n${codeContent}\n\nRespond ONLY with valid JSON.`;

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
      console.error('SecurityAgent error:', error);
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
