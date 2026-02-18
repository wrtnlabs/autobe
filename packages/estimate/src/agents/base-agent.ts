import { EvaluationContext } from "../types";
import { LLMClient } from "./llm-client";
import { AgentConfig, AgentIssue, AgentResult } from "./types";

/** Base class for AI evaluation agents */
export abstract class BaseAgent {
  abstract readonly name: string;
  abstract readonly description: string;

  protected client: LLMClient;
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.client = new LLMClient(config);
  }

  /** Run the agent evaluation */
  abstract evaluate(context: EvaluationContext): Promise<AgentResult>;

  /** Parse JSON response from LLM */
  protected parseResponse(content: string): {
    issues: AgentIssue[];
    score: number;
    summary: string;
  } {
    try {
      let jsonStr = content;
      if (jsonStr.includes("```json")) {
        jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (jsonStr.includes("```")) {
        jsonStr = jsonStr.replace(/```\n?/g, "");
      }

      const parsed = JSON.parse(jsonStr.trim());

      return {
        issues: parsed.issues || [],
        score: typeof parsed.score === "number" ? parsed.score : 100,
        summary: parsed.summary || "No summary provided",
      };
    } catch (_error) {
      console.error("Failed to parse agent response:", _error);
      console.error("Raw content:", content);

      return {
        issues: [],
        score: 100,
        summary: "Failed to parse agent response",
      };
    }
  }

  /** Read file contents for evaluation */
  protected async readFiles(filePaths: string[]): Promise<Map<string, string>> {
    const fs = await import("fs/promises");
    const contents = new Map<string, string>();

    for (const filePath of filePaths) {
      try {
        const content = await fs.readFile(filePath, "utf-8");
        contents.set(filePath, content);
      } catch (_error) {
        console.error(`Failed to read file: ${filePath}`);
      }
    }

    return contents;
  }

  /** Load prompt from file in prompts/ directory */
  protected async loadPrompt(filename: string): Promise<string> {
    const fs = await import("fs/promises");
    const path = await import("path");
    const promptPath = path.resolve(__dirname, "../../prompts", filename);
    return fs.readFile(promptPath, "utf-8");
  }

  /** Truncate content if too long */
  protected truncateContent(content: string, maxChars: number = 50000): string {
    if (content.length <= maxChars) {
      return content;
    }
    return content.slice(0, maxChars) + "\n\n... [truncated due to length]";
  }
}
