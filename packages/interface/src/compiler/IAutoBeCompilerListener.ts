import { IAutoBeRealizeCompilerListener } from "./IAutoBeRealizeCompilerListener";

/**
 * Interface defining event listener configuration for the AutoBE compiler
 * infrastructure.
 *
 * This interface provides a centralized listener configuration structure that
 * enables real-time event monitoring and feedback throughout the compilation
 * pipeline. It allows external systems to observe and react to compilation
 * events, test execution progress, and validation outcomes across all compiler
 * phases.
 *
 * The listener system facilitates progress tracking, error monitoring, and
 * detailed logging capabilities that are essential for debugging compilation
 * issues, monitoring test execution, and providing real-time feedback during
 * the automated development workflow.
 *
 * @author Samchon
 */
export interface IAutoBeCompilerListener {
  /**
   * Event listener configuration for Realize compiler operations.
   *
   * Provides comprehensive event monitoring for the Realize compilation phase,
   * including controller generation events, test execution progress, operation
   * results, and validation outcomes. This listener enables real-time tracking
   * of backend implementation validation and E2E test suite execution.
   *
   * The Realize listener captures critical events such as test operation
   * start/completion, validation successes/failures, compilation progress, and
   * detailed error information that assists in identifying and resolving
   * implementation issues during the automated development process.
   */
  realize: IAutoBeRealizeCompilerListener;
}
