import { ITraceable } from "./AutoBeAnalyzeDocumentTraceable";

/**
 * Deployment environment requirement.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentPhysicalPerformanceDeployment extends ITraceable {
  /** Requirement text */
  text: string;
}

/**
 * Quantitative performance metric.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentPhysicalPerformanceMetric extends ITraceable {
  /** Metric name (e.g., "API Response Time") */
  metric: string;
  /** Target value (e.g., "< 200ms for 95th percentile") */
  target: string;
  /** Measurement method */
  measurement: string;
}

/**
 * SRS Section 5: Physical and Performance Characteristics.
 *
 * Defines physical/deployment constraints and quantitative performance
 * requirements. Performance requirements must include measurable metrics.
 *
 * Optional category: selected only for projects that explicitly need
 * performance requirements.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentPhysicalPerformance {
  /** Deployment environment requirements */
  deploymentRequirements: Array<AutoBeAnalyzeDocumentPhysicalPerformanceDeployment>;

  /** Quantitative performance metrics */
  performanceMetrics: Array<AutoBeAnalyzeDocumentPhysicalPerformanceMetric>;
}
