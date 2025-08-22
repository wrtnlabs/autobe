import { CompressUtil } from "@autobe/filesystem";
import { IAutoBeRpcListener, IAutoBeRpcService } from "@autobe/interface";
import { IAutoBePlaygroundReplay, IPage } from "@autobe/playground-sdk";
import fs from "fs";
import { WebSocketAcceptor } from "tgrid";
import { Singleton } from "tstl";
import typia from "typia";

import { AutoBeMockAgent } from "../../../../packages/agent/src";
import { MapUtil } from "../../../../packages/utils/src";
import { AutoBePlaygroundAcceptorProvider } from "./AutoBePlaygroundAcceptorProvider";

export namespace AutoBePlaygroundReplayProvider {
  export const index = async (
    input: IAutoBePlaygroundReplay.IRequest,
  ): Promise<IPage<IAutoBePlaygroundReplay>> => {
    let data: IAutoBePlaygroundReplay[] = (await entire.get()).slice();
    if (!!input.search?.project?.length)
      data = data.filter((item) => item.project === input.search?.project);
    if (!!input.search?.vendor?.length)
      data = data.filter((item) => item.vendor === input.search?.vendor);
    if (!!input.sort?.length)
      for (const item of input.sort) {
        const multiplier = item[0] === "-" ? -1 : 1;
        const key = item.slice(1) as "vendor" | "project";
        data = data.sort((a, b) => a[key].localeCompare(b[key]) * multiplier);
      }
    return {
      pagination: {},
      data,
    };
  };

  export const get = async (
    props: IAutoBePlaygroundReplay,
    acceptor: WebSocketAcceptor<null, IAutoBeRpcService, IAutoBeRpcListener>,
  ): Promise<void> => {
    const load = async <T>(title: string): Promise<T | null> => {
      const location: string = `${ROOT}/${props.vendor}/${props.project}.${title}.json.gz`;
      try {
        const compressed: Buffer = await fs.promises.readFile(location);
        const content: string = await CompressUtil.gunzip(compressed);
        return JSON.parse(content) as T;
      } catch {
        return null;
      }
    };
    const preset: AutoBeMockAgent.IPreset = {
      histories: (await load(props.step ?? "realize"))!,
      analyze: await load("analyze.snapshots"),
      prisma: await load("prisma.snapshots"),
      interface: await load("interface.snapshots"),
      test: await load("test.snapshots"),
      realize: await load("realize.snapshots"),
    };
    await AutoBePlaygroundAcceptorProvider.accept(
      acceptor,
      (compiler) =>
        new AutoBeMockAgent({
          preset,
          compiler: () => compiler,
        }),
    );
  };
}

const entire = new Singleton(async (): Promise<IAutoBePlaygroundReplay[]> => {
  interface IProjectState {
    analyze: IStepState | null;
    prisma: IStepState | null;
    interface: IStepState | null;
    test: IStepState | null;
    realize: IStepState | null;
  }
  interface IStepState {
    histories: boolean;
    snapshots: boolean;
  }
  const getStep = (state: IProjectState) => {
    for (const key of [
      "realize",
      "test",
      "interface",
      "prisma",
      "analyze",
    ] as const)
      if (state[key] && state[key].histories && state[key].snapshots)
        return key;
    return null;
  };

  const replays: IAutoBePlaygroundReplay[] = [];
  const iterate = async (vendor: string) => {
    const projectDict: Map<string, IProjectState> = new Map();
    const emplace = (
      project: string,
      step: keyof IProjectState,
    ): IStepState => {
      const elem = MapUtil.take(projectDict, project, () => ({
        analyze: null,
        prisma: null,
        interface: null,
        test: null,
        realize: null,
      }));
      return (elem[step] ??= { histories: false, snapshots: false });
    };
    for (const file of await fs.promises.readdir(`${ROOT}/${vendor}`)) {
      const next: string = `${ROOT}/${vendor}/${file}`;
      const stat: fs.Stats = await fs.promises.stat(next);
      if (stat.isDirectory() === true) await iterate(`${vendor}/${file}`);
      else if (file.endsWith(".json.gz")) {
        const [project, step] = file.split(".");
        if (typia.is<keyof IProjectState>(step) === false) continue;
        else if (file === `${project}.${step}.json.gz`)
          emplace(project, step).histories = true;
        else if (file === `${project}.${step}.snapshots.json.gz`)
          emplace(project, step).snapshots = true;
      }
    }
    for (const [name, metadata] of projectDict) {
      const step = getStep(metadata);
      if (step === null) continue;
      replays.push({
        vendor,
        project: name,
        step,
      });
    }
  };
  await iterate(ROOT);
  return replays;
});

const ROOT: string = `${__dirname}/../../../../test/assets/histories`;
