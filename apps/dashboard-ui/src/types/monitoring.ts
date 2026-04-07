export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export const PIPELINE_PHASES = [
  "analyze",
  "database",
  "interface",
  "realize",
  "test",
] as const;

export type PipelinePhase = (typeof PIPELINE_PHASES)[number];

export interface PhaseStatus {
  phase: PipelinePhase;
  status: "pending" | "active" | "completed";
  elapsed?: number;
  step?: number;
}
