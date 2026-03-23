import { AutoBePhase } from "../histories";
import { AutoBeExampleProject } from "../typings/AutoBeExampleProject";

/**
 * Interface representing an available example from the benchmark example
 * storage.
 *
 * Used to list available vendor/project/phase combinations for mock session
 * creation and direct replay.
 *
 * @author Samchon
 */
export interface IAutoBePlaygroundExample {
  /** Vendor/model slug (e.g. "openai/gpt-4.1"). */
  vendor: string;

  /** Example project name. */
  project: AutoBeExampleProject;

  /** Phases that have recorded data available. */
  phases: AutoBePhase[];
}
