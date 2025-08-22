import { AutoBeEventSnapshot } from "../events/AutoBeEventSnapshot";
import { AutoBeHistory } from "../histories/AutoBeHistory";
import { IAutoBeTokenUsageJson } from "../json";

export interface IAutoBePlaygroundReplay {
  vendor: string;
  project: string;
  histories: AutoBeHistory[];
  analyze: AutoBeEventSnapshot[] | null;
  prisma: AutoBeEventSnapshot[] | null;
  interface: AutoBeEventSnapshot[] | null;
  test: AutoBeEventSnapshot[] | null;
  realize: AutoBeEventSnapshot[] | null;
}
export namespace IAutoBePlaygroundReplay {
  export interface IProps {
    vendor: string;
    project: string;
    step: "analyze" | "prisma" | "interface" | "test" | "realize";
  }
  export interface ISummary extends IProps {
    tokenUsage: IAutoBeTokenUsageJson;
    elapsed: number;
    analyze: IStepState | null;
    prisma: IStepState | null;
    interface: IStepState | null;
    test: IStepState | null;
    realize: IStepState | null;
  }
  export interface IStepState {
    success: boolean;
    elapsed: number;
    aggregate: Record<string, number>;
  }
}
