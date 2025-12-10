import {
  AutoBeAnalyzeHistory,
  AutoBeInterfaceHistory,
  AutoBePrismaHistory,
  AutoBeRealizeHistory,
  AutoBeTestHistory,
} from "@autobe/interface";

/**
 * Pipeline state tracking completion histories for all phases.
 *
 * Each phase stores its latest and previous execution history. The step counter
 * pattern enables automatic dependency tracking: when a phase reruns, its step
 * increments and downstream phases become invalid through step mismatch.
 *
 * State is reconstructed from event history. `null` means the phase hasn't
 * completed yet.
 *
 * @author Samchon
 */
export interface AutoBeState {
  /** Latest requirements analysis history. `null` if not completed. */
  analyze: AutoBeAnalyzeHistory | null;

  /** Latest database schema history. `null` if not completed. */
  prisma: AutoBePrismaHistory | null;

  /** Latest API specification history. `null` if not completed. */
  interface: AutoBeInterfaceHistory | null;

  /** Latest E2E test suite history. `null` if not completed. */
  test: AutoBeTestHistory | null;

  /** Latest implementation history. `null` if not completed. */
  realize: AutoBeRealizeHistory | null;

  /**
   * Previous requirements analysis history for comparison. `null` if executed
   * 0-1 times.
   */
  previousAnalyze: AutoBeAnalyzeHistory | null;

  /**
   * Previous database schema history for comparison. `null` if executed 0-1
   * times.
   */
  previousPrisma: AutoBePrismaHistory | null;

  /**
   * Previous API specification history for comparison. `null` if executed 0-1
   * times.
   */
  previousInterface: AutoBeInterfaceHistory | null;

  /**
   * Previous E2E test suite history for comparison. `null` if executed 0-1
   * times.
   */
  previousTest: AutoBeTestHistory | null;

  /**
   * Previous implementation history for comparison. `null` if executed 0-1
   * times.
   */
  previousRealize: AutoBeRealizeHistory | null;
}
