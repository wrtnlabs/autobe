import { AutoBeMockAgent } from "@autobe/agent";
import { CompressUtil } from "@autobe/filesystem";
import { IAutoBePlaygroundReplay } from "@autobe/interface";
import fs from "fs";

import { AutoBeHackathonConfiguration } from "../../AutoBeHackathonConfiguration";
import { AutoBeHackathonSessionCompiler } from "./AutoBeHackathonSessionCompiler";

export namespace AutoBeHackathonSessionSimulator {
  export const agent = async (): Promise<AutoBeMockAgent> =>
    new AutoBeMockAgent({
      replay: await getReplay(),
      compiler: () => AutoBeHackathonSessionCompiler.get(),
    });

  const getReplay = async (): Promise<IAutoBePlaygroundReplay> => {
    const load = async <T>(title: string): Promise<T | null> => {
      const location: string = `${ROOT}/${PROJECT}.${title}.json.gz`;
      try {
        const compressed: Buffer = await fs.promises.readFile(location);
        const content: string = await CompressUtil.gunzip(compressed);
        return JSON.parse(content) as T;
      } catch {
        return null;
      }
    };
    return {
      vendor: "openai/gpt-4.1",
      project: PROJECT,
      histories: (await load("realize")) ?? [],
      analyze: await load("analyze.snapshots"),
      prisma: await load("prisma.snapshots"),
      interface: await load("interface.snapshots"),
      test: await load("test.snapshots"),
      realize: await load("realize.snapshots"),
    };
  };
}

const VENDOR: string = "openai/gpt-4.1";
const PROJECT: string = "bbs";
const ROOT: string = `${AutoBeHackathonConfiguration.ROOT}/../../test/assets/histories/${VENDOR}`;
