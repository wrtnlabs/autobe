import { AutoBeMockAgent } from "@autobe/agent";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBePhase, IAutoBePlaygroundReplay } from "@autobe/interface";

import { AutoBeHackathonSessionCompiler } from "./AutoBeHackathonSessionCompiler";

export namespace AutoBeHackathonSessionSimulator {
  export const agent = async (): Promise<AutoBeMockAgent> =>
    new AutoBeMockAgent({
      replay: await getReplay(),
      compiler: () => AutoBeHackathonSessionCompiler.get(),
    });

  const getReplay = async (): Promise<IAutoBePlaygroundReplay> => {
    const snapshots = (phase: AutoBePhase) =>
      AutoBeExampleStorage.getSnapshots({
        vendor: VENDOR,
        project: PROJECT,
        phase,
      });
    return {
      vendor: "openai/gpt-4.1",
      project: PROJECT,
      histories: await AutoBeExampleStorage.getHistories({
        vendor: VENDOR,
        project: PROJECT,
        phase: "realize",
      }),
      analyze: await snapshots("analyze"),
      database: await snapshots("database"),
      interface: await snapshots("interface"),
      test: await snapshots("test"),
      realize: await snapshots("realize"),
    };
  };
}

const VENDOR: string = "openai/gpt-4.1";
const PROJECT = "bbs" as const;
