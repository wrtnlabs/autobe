import { AutoBeMockAgent } from "@autobe/agent";
import { CompressUtil } from "@autobe/filesystem";
import {
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBePhase,
  IAutoBePlaygroundReplay,
  IAutoBeRpcListener,
  IAutoBeRpcService,
} from "@autobe/interface";
import { MapUtil } from "@autobe/utils";
import fs from "fs";
import path from "path";
import { WebSocketAcceptor } from "tgrid";
import typia from "typia";

import { AutoBePlaygroundAcceptor } from "./AutoBePlaygroundAcceptor";

export namespace AutoBePlaygroundReplayProvider {
  export const index = async (): Promise<
    IAutoBePlaygroundReplay.ISummary[]
  > => {
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

    const replays: IAutoBePlaygroundReplay.IProps[] = [];
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
        if (stat.isDirectory() === true)
          await iterate([vendor, file].filter((s) => s.length).join("/"));
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
          phase: step,
        });
      }
    };
    await iterate("");
    const data: IAutoBePlaygroundReplay.ISummary[] = await Promise.all(
      replays.map(async (r) => {
        const load = async <T>(file: string): Promise<T> =>
          JSON.parse(
            await CompressUtil.gunzip(
              await fs.promises.readFile(`${ROOT}/${r.vendor}/${file}`),
            ),
          );

        const histories: AutoBeHistory[] = await load(
          `${r.project}.${r.phase}.json.gz`,
        );
        const snapshots: AutoBeEventSnapshot[] = await load(
          `${r.project}.${r.phase}.snapshots.json.gz`,
        );
        const predicate = <Type extends AutoBePhase>(
          type: Type,
          success: (history: AutoBeHistory.Mapper[Type]) => boolean,
          aggregate: (
            history: AutoBeHistory.Mapper[Type],
          ) => Record<string, number>,
        ): IAutoBePlaygroundReplay.IPhaseState | null => {
          const history: AutoBeHistory.Mapper[Type] | undefined =
            histories.find((h) => h.type === type) as
              | AutoBeHistory.Mapper[Type]
              | undefined;
          if (history === undefined) return null;
          return {
            success: success(history),
            aggregate: aggregate(history),
            elapsed:
              new Date(history.completed_at).getTime() -
              new Date(history.created_at).getTime(),
          };
        };

        return {
          ...r,
          tokenUsage: snapshots.at(-1)!.tokenUsage,
          elapsed: histories
            .filter(
              (h) => h.type !== "userMessage" && h.type !== "assistantMessage",
            )
            .map(
              (h) =>
                new Date(h.completed_at).getTime() -
                new Date(h.created_at).getTime(),
            )
            .reduce((a, b) => a + b, 0),
          analyze: predicate(
            "analyze",
            () => true,
            (h) => ({
              actors: h.roles.length,
              documents: h.files.length,
            }),
          ),
          prisma: predicate(
            "prisma",
            (h) => h.compiled.type === "success",
            (h) => ({
              namespaces: h.result.data.files.length,
              models: h.result.data.files.map((f) => f.models).flat().length,
            }),
          ),
          interface: predicate(
            "interface",
            () => true,
            (h) => ({
              operations: h.document.operations.length,
              schemas: Object.keys(h.document.components.schemas).length,
            }),
          ),
          test: predicate(
            "test",
            (h) => h.compiled.type === "success",
            (h) => ({
              functions: h.files.length,
              ...(h.compiled.type === "failure"
                ? {
                    errors: new Set(
                      h.compiled.diagnostics.map((d) => d.file ?? ""),
                    ).size,
                  }
                : {}),
            }),
          ),
          realize: predicate(
            "realize",
            (h) => h.compiled.type === "success",
            (h) => ({
              functions: h.functions.length,
              ...(h.compiled.type === "failure"
                ? {
                    errors: new Set(
                      h.compiled.diagnostics.map((d) => d.file ?? ""),
                    ).size,
                  }
                : {}),
            }),
          ),
        } satisfies IAutoBePlaygroundReplay.ISummary;
      }),
    );
    return data.sort((a, b) =>
      a.vendor !== b.vendor
        ? a.vendor.localeCompare(b.vendor)
        : a.project.localeCompare(b.project),
    );
  };

  export const get = async (
    acceptor: WebSocketAcceptor<
      undefined,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >,
    props: IAutoBePlaygroundReplay.IProps,
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
    const histories: AutoBeHistory[] | null = await load(
      props.phase ?? "realize",
    );
    if (histories === null) {
      await acceptor.reject(1002, "Unable to find the matched replay");
      return;
    }

    const replay: IAutoBePlaygroundReplay = {
      vendor: props.vendor,
      project: props.project,
      histories,
      analyze: await load("analyze.snapshots"),
      prisma: await load("prisma.snapshots"),
      interface: await load("interface.snapshots"),
      test: await load("test.snapshots"),
      realize: await load("realize.snapshots"),
    };
    await AutoBePlaygroundAcceptor.accept({
      prefix: `${props.vendor}/${props.project}/replay`,
      acceptor,
      agent: (compiler) =>
        new AutoBeMockAgent({
          replay,
          compiler: () => compiler,
        }),
    });
  };
}

const ROOT: string = path.resolve(
  `${__dirname}/../../../../test/assets/histories`,
);
