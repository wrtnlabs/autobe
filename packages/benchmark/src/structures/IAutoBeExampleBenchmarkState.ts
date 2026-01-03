import {
  AutoBeEventSnapshot,
  AutoBeExampleProject,
  AutoBePhase,
} from "@autobe/interface";

export interface IAutoBeExampleBenchmarkState {
  vendors: IAutoBeExampleBenchmarkState.IOfVendor[];
}
export namespace IAutoBeExampleBenchmarkState {
  export interface IOfVendor {
    name: string;
    projects: IOfProject[];
  }
  export interface IOfProject {
    name: AutoBeExampleProject;
    phases: IOfPhase[];
    success: boolean | null;
    started_at: Date | null;
    completed_at: Date | null;
  }
  export interface IOfPhase {
    name: AutoBePhase;
    snapshot: AutoBeEventSnapshot | null;
    success: boolean | null;
    started_at: Date;
    completed_at: Date | null;
    count: number;
  }
}
