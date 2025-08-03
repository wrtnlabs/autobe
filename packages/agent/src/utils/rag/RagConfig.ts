/**
 * Configuration options for RAG-based token optimization
 */

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
   * Maximum batch size for test scenario generation
   */
  batchSize: number;
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
  batchSize: 15                    // Up from 5 for efficiency
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
  batchSize: 10
};

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