import {
  AutoBeEvent,
  AutoBeExampleProject,
  AutoBePhase,
  IAutoBeAgent,
} from "@autobe/interface";

import { IAutoBeExampleBenchmarkState } from "../structures/IAutoBeExampleBenchmarkState";
import { AutoBeExampleArchiver } from "./AutoBeExampleArchiver";

export namespace AutoBeExampleBenchmark {
  export interface IContext {
    createAgent: (
      props: AutoBeExampleArchiver.IAgentProps,
    ) => Promise<IAutoBeAgent>;
  }

  export const execute = async (
    ctx: IContext,
    props: {
      vendors: string[];
      projects?: AutoBeExampleProject[];
      phases?: AutoBePhase[];
      imagePath?: string;
      progress: (state: IAutoBeExampleBenchmarkState) => void;
      on?: (event: AutoBeEvent) => void;
    },
  ): Promise<void> => {
    const state: IAutoBeExampleBenchmarkState = {
      vendors: props.vendors.map(
        (vendor): IAutoBeExampleBenchmarkState.IOfVendor => ({
          name: vendor,
          projects: PROJECT_SEQUENCE.filter(
            (p) => !props.projects || props.projects.includes(p),
          ).map(
            (project): IAutoBeExampleBenchmarkState.IOfProject => ({
              name: project,
              phases: [],
              success: null,
              started_at: null,
              completed_at: null,
            }),
          ),
        }),
      ),
    };
    const report = () => props.progress(state);
    await Promise.all(
      state.vendors.map(async (vendor) => {
        await executeVendor(ctx, {
          imagePath: props.imagePath,
          phases: props.phases,
          vendorState: vendor,
          on: props.on,
          report,
        });
      }),
    );
  };

  const executeVendor = async (
    ctx: IContext,
    props: {
      imagePath?: string;
      vendorState: IAutoBeExampleBenchmarkState.IOfVendor;
      phases?: AutoBePhase[];
      report: () => void;
      on?: (event: AutoBeEvent) => void;
    },
  ): Promise<void> => {
    for (const project of props.vendorState.projects)
      await executeProject(ctx, {
        imagePath: props.imagePath,
        vendor: props.vendorState.name,
        projectState: project,
        phases: props.phases,
        report: props.report,
        on: props.on,
      });
  };

  const executeProject = async (
    ctx: IContext,
    props: {
      vendor: string;
      projectState: IAutoBeExampleBenchmarkState.IOfProject;
      imagePath?: string;
      phases?: AutoBePhase[];
      report: () => void;
      on?: (event: AutoBeEvent) => void;
    },
  ): Promise<void> => {
    props.projectState.started_at = new Date();
    for (const phase of PHASE_SEQUENCE) {
      if (props.phases && props.phases.includes(phase) === false) continue;
      const phaseState: IAutoBeExampleBenchmarkState.IOfPhase = {
        name: phase,
        snapshot: null,
        success: null,
        started_at: new Date(),
        completed_at: null,
        count: 0,
      };
      props.projectState.phases.push(phaseState);
      try {
        phaseState.started_at = new Date();
        phaseState.completed_at = null;
        phaseState.count = 0;
        const success: boolean = await getArchiver(phase)({
          vendor: props.vendor,
          project: props.projectState.name,
          imagePath: props.imagePath,
          agent: (next) => ctx.createAgent(next),
          on: (s) => {
            ++phaseState.count;
            const event = s.event;
            if (
              event.type !== "jsonValidateError" &&
              event.type !== "jsonParseError" &&
              event.type !== "preliminary" &&
              event.type !== "consentFunctionCall"
            )
              phaseState.snapshot = s;
            props.report();
            if (props.on) props.on(s.event);
          },
        });
        phaseState.success = success;
        phaseState.completed_at = new Date();
        props.report();
      } catch (error) {
        console.log(
          props.vendor,
          props.projectState.name,
          phaseState.name,
          error,
        );
        throw error;
      }
      if (phaseState.success === null || phaseState.success === false) break;
    }
    props.projectState.completed_at = new Date();
    props.projectState.success = props.projectState.phases.every(
      (phase) => phase.success === true,
    );
    props.report();
  };
}

const getArchiver = (phase: AutoBePhase) => {
  if (phase === "analyze") return AutoBeExampleArchiver.archiveAnalyze;
  else if (phase === "database") return AutoBeExampleArchiver.archivePrisma;
  else if (phase === "interface") return AutoBeExampleArchiver.archiveInterface;
  else if (phase === "test") return AutoBeExampleArchiver.archiveTest;
  else if (phase === "realize") return AutoBeExampleArchiver.archiveRealize;
  phase satisfies never;
  throw new Error(`Unknown phase: ${phase}`);
};

const PROJECT_SEQUENCE = [
  "todo",
  "bbs",
  "reddit",
  "shopping",
  "account",
] as const;
const PHASE_SEQUENCE = [
  "analyze",
  "database",
  "interface",
  "test",
  "realize",
] as const;
