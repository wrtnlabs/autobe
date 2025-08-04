/**
 * Prompt optimization utilities for reducing system prompt token consumption.
 * 
 * Dynamically trims and optimizes system prompts based on current operation context
 * to reduce token usage while preserving essential instructions.
 */

import { WorkflowStage, IWorkflowContext } from './SemanticSimilarity';

export interface IPromptOptimization {
  /**
   * Optimized prompt content
   */
  content: string;
  
  /**
   * Original prompt length
   */
  originalLength: number;
  
  /**
   * Optimized prompt length
   */
  optimizedLength: number;
  
  /**
   * Reduction percentage
   */
  reductionPercent: number;
  
  /**
   * Sections that were removed
   */
  removedSections: string[];
}

/**
 * Configuration for prompt optimization
 */
export interface IPromptOptimizationConfig {
  /**
   * Maximum allowed prompt length (in characters)
   */
  maxLength?: number;
  
  /**
   * Target reduction percentage (0-1)
   */
  targetReduction?: number;
  
  /**
   * Preserve essential sections even if they exceed limits
   */
  preserveEssential?: boolean;
  
  /**
   * Current workflow context for relevance filtering
   */
  context?: IWorkflowContext;
}

/**
 * Prompt optimization utilities
 */
export namespace PromptOptimizer {
  /**
   * Optimize a system prompt for current workflow context
   */
  export function optimize(
    prompt: string,
    config: IPromptOptimizationConfig = {}
  ): IPromptOptimization {
    const {
      maxLength = 2000,
      targetReduction = 0.4,
      preserveEssential = true,
      context
    } = config;
    
    const originalLength = prompt.length;
    let optimizedContent = prompt;
    const removedSections: string[] = [];
    
    // Parse prompt into sections
    const sections = parsePromptSections(prompt);
    
    // Score sections by relevance to current context
    const sectionScores = scoreSectionRelevance(sections, context);
    
    // Remove least relevant sections until target is met
    let currentLength = originalLength;
    const targetLength = Math.max(maxLength, originalLength * (1 - targetReduction));
    
    for (const { section, name } of sectionScores.sort((a, b) => a.score - b.score)) {
      if (currentLength <= targetLength) break;
      
      // Preserve essential sections if configured
      if (preserveEssential && isEssentialSection(section, context)) {
        continue;
      }
      
      // Remove section
      optimizedContent = optimizedContent.replace(section, '');
      currentLength = optimizedContent.length;
      removedSections.push(name);
    }
    
    // Clean up extra whitespace
    optimizedContent = cleanupPrompt(optimizedContent);
    
    return {
      content: optimizedContent,
      originalLength,
      optimizedLength: optimizedContent.length,
      reductionPercent: (originalLength - optimizedContent.length) / originalLength,
      removedSections
    };
  }
  
  /**
   * Optimize prompts for specific workflow stages
   */
  export function optimizeForStage(
    prompt: string,
    stage: WorkflowStage,
    operationContext?: any
  ): IPromptOptimization {
    const context: IWorkflowContext = {
      stage,
      currentOperation: operationContext
    };
    
    const stageConfigs: Record<WorkflowStage, IPromptOptimizationConfig> = {
      analyze: {
        maxLength: 1500,
        targetReduction: 0.3,
        context
      },
      prisma: {
        maxLength: 1800,
        targetReduction: 0.4,
        context
      },
      interface: {
        maxLength: 2000,
        targetReduction: 0.5,
        context
      },
      test: {
        maxLength: 2200,
        targetReduction: 0.6,
        context
      },
      realize: {
        maxLength: 2500,
        targetReduction: 0.7, // Most aggressive for largest prompts
        context
      }
    };
    
    return optimize(prompt, stageConfigs[stage]);
  }
}

/**
 * Parse prompt into logical sections
 */
function parsePromptSections(prompt: string): Array<{ name: string; content: string; startIndex: number; endIndex: number }> {
  const sections: Array<{ name: string; content: string; startIndex: number; endIndex: number }> = [];
  
  // Split by markdown headers and common section markers
  const sectionRegex = /^(#{1,6}\s+.+|##\s+.+|\*\*[^*]+\*\*|[A-Z][A-Z\s]+:|\d+\.\s+[^\.]+)/gm;
  let lastIndex = 0;
  let match;
  
  while ((match = sectionRegex.exec(prompt)) !== null) {
    if (lastIndex < match.index) {
      // Add content before this header
      const content = prompt.slice(lastIndex, match.index).trim();
      if (content) {
        sections.push({
          name: 'content',
          content,
          startIndex: lastIndex,
          endIndex: match.index
        });
      }
    }
    
    // Find the end of this section (next header or end of string)
    const nextMatch = sectionRegex.exec(prompt);
    const endIndex = nextMatch ? nextMatch.index : prompt.length;
    sectionRegex.lastIndex = match.index; // Reset for next iteration
    
    const sectionContent = prompt.slice(match.index, endIndex).trim();
    sections.push({
      name: match[1].replace(/[#*:]/g, '').trim(),
      content: sectionContent,
      startIndex: match.index,
      endIndex
    });
    
    lastIndex = endIndex;
  }
  
  // Add remaining content
  if (lastIndex < prompt.length) {
    const content = prompt.slice(lastIndex).trim();
    if (content) {
      sections.push({
        name: 'content',
        content,
        startIndex: lastIndex,
        endIndex: prompt.length
      });
    }
  }
  
  return sections;
}

/**
 * Score sections by relevance to current workflow context
 */
function scoreSectionRelevance(
  sections: Array<{ name: string; content: string; startIndex: number; endIndex: number }>,
  context?: IWorkflowContext
): Array<{ section: string; score: number; name: string }> {
  return sections.map(({ name, content }) => {
    let score = 0.5; // Base relevance
    
    // Essential sections (always preserve)
    const essentialKeywords = ['required', 'must', 'error', 'validation', 'format', 'schema', 'structure'];
    if (essentialKeywords.some(keyword => content.toLowerCase().includes(keyword))) {
      score += 0.4;
    }
    
    // Stage-specific relevance
    if (context) {
      const stageKeywords = getStageKeywords(context.stage);
      const contentLower = content.toLowerCase();
      
      stageKeywords.forEach(keyword => {
        if (contentLower.includes(keyword)) {
          score += 0.2;
        }
      });
      
      // Operation-specific relevance
      if (context.currentOperation) {
        const operationText = JSON.stringify(context.currentOperation).toLowerCase();
        const operationKeywords = extractKeywords(operationText);
        
        operationKeywords.forEach(keyword => {
          if (contentLower.includes(keyword)) {
            score += 0.1;
          }
        });
      }
    }
    
    // Length penalty (longer sections are less critical)
    const lengthPenalty = Math.min(content.length / 1000, 0.3);
    score -= lengthPenalty;
    
    return {
      section: content,
      score: Math.max(0, Math.min(1, score)),
      name
    };
  });
}

/**
 * Check if a section is essential and should be preserved
 */
function isEssentialSection(content: string, _context?: IWorkflowContext): boolean {
  const essentialPatterns = [
    /required|must|mandatory/i,
    /error|exception|validation/i,
    /format|structure|schema/i,
    /example|sample/i
  ];
  
  return essentialPatterns.some(pattern => pattern.test(content));
}

/**
 * Get keywords relevant to specific workflow stages
 */
function getStageKeywords(stage: WorkflowStage): string[] {
  const stageKeywords: Record<WorkflowStage, string[]> = {
    analyze: ['requirement', 'specification', 'analysis', 'planning'],
    prisma: ['database', 'schema', 'model', 'relation', 'field', 'table'],
    interface: ['api', 'endpoint', 'operation', 'openapi', 'swagger', 'schema'],
    test: ['test', 'scenario', 'assertion', 'validation', 'e2e'],
    realize: ['implementation', 'code', 'function', 'controller', 'service', 'nestjs']
  };
  
  return stageKeywords[stage] || [];
}

/**
 * Extract keywords from text for relevance scoring
 */
function extractKeywords(text: string): string[] {
  // Simple keyword extraction - could be enhanced with NLP
  const words = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
  const uniqueWords = [...new Set(words)];
  
  // Filter out common words
  const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'too', 'way', 'what', 'when', 'where', 'will', 'with'];
  
  return uniqueWords.filter(word => 
    !stopWords.includes(word) && 
    word.length > 3
  ).slice(0, 20); // Limit to most relevant keywords
}

/**
 * Clean up prompt after section removal
 */
function cleanupPrompt(prompt: string): string {
  return prompt
    .replace(/\n\n\n+/g, '\n\n') // Remove excessive line breaks
    .replace(/^\s+|\s+$/g, '') // Trim whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n'); // Normalize spacing
}