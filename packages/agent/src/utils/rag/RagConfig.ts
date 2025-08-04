/**
 * Configuration options for RAG-based token optimization across all AutoBE workflow stages
 */

import { WorkflowStage } from "./SemanticSimilarity";

export interface IRagConfig {
  /**
   * Enable/disable RAG optimization
   */
  enabled: boolean;
  
  /**
   * Maximum number of operations to include per scenario
   */
  maxOperationsPerScenario: number;
  
  /**
   * Maximum number of schemas to include
   */
  maxSchemas: number;
  
  /**
   * Minimum semantic similarity score for inclusion
   */
  minSimilarityScore: number;
  
  /**
   * Whether to use aggressive mode (more filtering)
   */
  aggressiveMode: boolean;
  
  /**
   * Maximum batch size for operation processing
   */
  batchSize: number;
  
  /**
   * Enable prompt optimization
   */
  optimizePrompts?: boolean;
  
  /**
   * Target prompt reduction percentage
   */
  promptReductionTarget?: number;
}

/**
 * Stage-specific RAG configuration
 */
export interface IStageRagConfig extends IRagConfig {
  /**
   * Workflow stage this config applies to
   */
  stage: WorkflowStage;
  
  /**
   * Stage-specific maximum items
   */
  maxHistory?: number;
}

/**
 * Default RAG configuration optimized for token efficiency
 */
export const DEFAULT_RAG_CONFIG: IRagConfig = {
  enabled: true,
  maxOperationsPerScenario: 10,    // Down from unlimited
  maxSchemas: 25,                  // Down from unlimited  
  minSimilarityScore: 0.2,         // Filter low relevance
  aggressiveMode: true,            // Enable aggressive filtering
  batchSize: 15,                   // Up from 5 for efficiency
  optimizePrompts: true,           // Enable prompt optimization
  promptReductionTarget: 0.4       // 40% prompt reduction
};

/**
 * Conservative RAG configuration for high-quality scenarios
 */
export const CONSERVATIVE_RAG_CONFIG: IRagConfig = {
  enabled: true,
  maxOperationsPerScenario: 20,
  maxSchemas: 50,
  minSimilarityScore: 0.1,
  aggressiveMode: false,
  batchSize: 10,
  optimizePrompts: true,
  promptReductionTarget: 0.3       // 30% prompt reduction
};

/**
 * Stage-specific RAG configurations optimized for each workflow
 */
export const STAGE_RAG_CONFIGS: Record<WorkflowStage, IStageRagConfig> = {
  analyze: {
    stage: 'analyze',
    enabled: true,
    maxOperationsPerScenario: 5,     // Analysis needs fewer examples
    maxSchemas: 15,
    minSimilarityScore: 0.3,
    aggressiveMode: false,           // Preserve context for analysis
    batchSize: 5,
    optimizePrompts: true,
    promptReductionTarget: 0.3,      // Conservative for analysis
    maxHistory: 10
  },
  
  prisma: {
    stage: 'prisma',
    enabled: true,
    maxOperationsPerScenario: 15,    // DB design needs more context
    maxSchemas: 30,
    minSimilarityScore: 0.2,
    aggressiveMode: true,
    batchSize: 10,
    optimizePrompts: true,
    promptReductionTarget: 0.4,
    maxHistory: 15
  },
  
  interface: {
    stage: 'interface',
    enabled: true,
    maxOperationsPerScenario: 25,    // API design needs comprehensive view
    maxSchemas: 50,
    minSimilarityScore: 0.15,
    aggressiveMode: true,
    batchSize: 15,                   // Larger batches for efficiency
    optimizePrompts: true,
    promptReductionTarget: 0.5,      // Aggressive prompt reduction
    maxHistory: 20
  },
  
  test: {
    stage: 'test',
    enabled: true,
    maxOperationsPerScenario: 10,    // Test scenarios are focused
    maxSchemas: 25,
    minSimilarityScore: 0.2,
    aggressiveMode: true,
    batchSize: 15,
    optimizePrompts: true,
    promptReductionTarget: 0.6,      // Very aggressive for large test prompts
    maxHistory: 25
  },
  
  realize: {
    stage: 'realize',
    enabled: true,
    maxOperationsPerScenario: 30,    // Implementation needs comprehensive context
    maxSchemas: 60,
    minSimilarityScore: 0.2,
    aggressiveMode: true,
    batchSize: 20,                   // Largest batches for efficiency
    optimizePrompts: true,
    promptReductionTarget: 0.7,      // Most aggressive (3500+ line prompts!)
    maxHistory: 30
  }
};

/**
 * Get stage-specific RAG configuration
 */
export function getStageRagConfig(stage: WorkflowStage): IStageRagConfig {
  return STAGE_RAG_CONFIGS[stage];
}

/**
 * Calculate estimated token reduction based on RAG config
 */
export function estimateTokenReduction(
  totalOperations: number,
  totalSchemas: number,
  config: IRagConfig
): { 
  estimatedReduction: number;
  operationsReduction: number;
  schemasReduction: number;
} {
  if (!config.enabled) {
    return {
      estimatedReduction: 0,
      operationsReduction: 0,
      schemasReduction: 0
    };
  }
  
  const operationsReduction = Math.min(
    (totalOperations - config.maxOperationsPerScenario) / totalOperations,
    0.95 // Cap at 95% reduction
  );
  
  const schemasReduction = Math.min(
    (totalSchemas - config.maxSchemas) / totalSchemas,
    0.95 // Cap at 95% reduction
  );
  
  // Weight operations more heavily as they typically consume more tokens
  const estimatedReduction = (operationsReduction * 0.6 + schemasReduction * 0.4);
  
  return {
    estimatedReduction: Math.max(0, estimatedReduction),
    operationsReduction: Math.max(0, operationsReduction),
    schemasReduction: Math.max(0, schemasReduction)
  };
}