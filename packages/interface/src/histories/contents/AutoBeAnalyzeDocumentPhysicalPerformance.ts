import { ITraceable } from "./AutoBeAnalyzeDocumentTraceable";

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
  deploymentRequirements: Array<{ text: string } & ITraceable>;

  /** Quantitative performance metrics */
  performanceMetrics: Array<
    {
      /** Metric name (e.g., "API Response Time") */
      metric: string;
      /** Target value (e.g., "< 200ms for 95th percentile") */
      target: string;
      /** Measurement method */
      measurement: string;
    } & ITraceable
  >;
}
