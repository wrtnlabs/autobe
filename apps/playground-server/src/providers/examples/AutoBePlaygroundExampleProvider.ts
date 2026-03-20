import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBePhase,
  IAutoBePlaygroundExample,
} from "@autobe/interface";
import typia from "typia";

const PHASES: AutoBePhase[] = [
  "analyze",
  "database",
  "interface",
  "test",
  "realize",
];

const PROJECTS: AutoBeExampleProject[] = typia.misc.literals<AutoBeExampleProject>();

export namespace AutoBePlaygroundExampleProvider {
  /**
   * List all available examples from the benchmark example storage.
   *
   * Scans vendor models and projects, returning only combinations that
   * have at least one phase with recorded data.
   */
  export const index = async (): Promise<IAutoBePlaygroundExample[]> => {
    const vendors: string[] = await AutoBeExampleStorage.getVendorModels();
    const result: IAutoBePlaygroundExample[] = [];

    for (const vendor of vendors) {
      for (const project of PROJECTS) {
        const phases: AutoBePhase[] = [];
        for (const phase of PHASES) {
          const exists = await AutoBeExampleStorage.has({
            vendor,
            project,
            phase,
          });
          if (exists) phases.push(phase);
        }
        if (phases.length > 0) {
          result.push({ vendor, project, phases });
        }
      }
    }
    return result;
  };
}
