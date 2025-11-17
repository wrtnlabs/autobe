import { AutoBeTokenUsage } from "@autobe/agent";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeExampleProject,
  AutoBeHistory,
  AutoBePhase,
  AutoBePrismaHistory,
  AutoBeUserMessageContent,
  IAutoBeAgent,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import typia from "typia";

import { AutoBeExampleStorage } from "./AutoBeExampleStorage";

export namespace AutoBeExampleArchiver {
  export interface IContext {
    vendor: string;
    project: AutoBeExampleProject;
    agent: (histories: AutoBeHistory[]) => Promise<IAutoBeAgent>;
    on: (snapshot: AutoBeEventSnapshot) => void;
  }

  export const archiveAnalyze = (ctx: IContext): Promise<boolean> =>
    archive(ctx, {
      phase: "analyze",
      trial: async (conversate): Promise<boolean> =>
        (await conversate(
          await AutoBeExampleStorage.getUserMessage({
            project: ctx.project,
            phase: "analyze",
          }).then((r) => r.contents),
        )) ||
        (await conversate(
          "I'm not familiar with the analyze feature. Please determine everything by yourself, and just show me the analysis report.",
        )) ||
        (await conversate(
          "I already told you to publish the analysis report. Never ask me anything, and just do it right now.",
        )),
      predicate: (histories): boolean =>
        histories.some((h) => h.type === "analyze"),
    });

  export const archivePrisma = (ctx: IContext): Promise<boolean> =>
    archive(ctx, {
      phase: "prisma",
      trial: getTrial({
        project: ctx.project,
        phase: "prisma",
      }),
      predicate: (histories): boolean => {
        const prisma: AutoBePrismaHistory | undefined = histories.find(
          (h) => h.type === "prisma",
        );
        return prisma !== undefined && prisma.compiled.type === "success";
      },
    });

  export const archiveInterface = (ctx: IContext): Promise<boolean> =>
    archive(ctx, {
      phase: "interface",
      trial: getTrial({
        project: ctx.project,
        phase: "interface",
      }),
      predicate: (histories): boolean => {
        const interfaceHistory: AutoBeHistory | undefined = histories.find(
          (h) => h.type === "interface",
        );
        return (
          interfaceHistory !== undefined && interfaceHistory.missed.length === 0
        );
      },
    });

  export const archiveTest = (ctx: IContext): Promise<boolean> =>
    archive(ctx, {
      phase: "test",
      trial: getTrial({
        project: ctx.project,
        phase: "test",
      }),
      predicate: (histories): boolean => {
        const testHistory: AutoBeHistory | undefined = histories.find(
          (h) => h.type === "test",
        );
        return (
          testHistory !== undefined && testHistory.compiled.type === "success"
        );
      },
    });

  export const archiveRealize = (ctx: IContext): Promise<boolean> =>
    archive(ctx, {
      phase: "realize",
      trial: getTrial({
        project: ctx.project,
        phase: "realize",
      }),
      predicate: (histories): boolean => {
        const realizeHistory: AutoBeHistory | undefined = histories.find(
          (h) => h.type === "realize",
        );
        return (
          realizeHistory !== undefined &&
          realizeHistory.compiled.type === "success"
        );
      },
    });

  const archive = async (
    ctx: IContext,
    props: {
      phase: AutoBePhase;
      trial: (
        conversate: (
          input: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
        ) => Promise<boolean>,
      ) => Promise<boolean>;
      predicate: (histories: AutoBeHistory[]) => boolean;
    },
  ): Promise<boolean> => {
    // INITIALIZE AGENT
    const asset: IAsset = await getAsset({
      vendor: ctx.vendor,
      project: ctx.project,
      phase: props.phase,
    });
    const agent: IAutoBeAgent = await ctx.agent(asset.histories);
    const snapshots: AutoBeEventSnapshot[] = [];
    for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>()) {
      agent.on(type, (e) => {
        const s: AutoBeEventSnapshot = {
          event: e,
          tokenUsage: agent.getTokenUsage(),
        };
        ctx.on(s);
        snapshots.push(s);
      });
    }

    try {
      // CONVERSATE
      const go = async (
        c: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
      ): Promise<boolean> => {
        const result: AutoBeHistory[] = await agent.conversate(c);
        return result.some((h) => h.type === props.phase);
      };
      const done: boolean = await props.trial(go);
      if (done === false)
        throw new Error(
          `Failed to function calling in the "${props.phase}" phase of the "${ctx.project}" project.`,
        );

      // AGGREGATE
      const histories: AutoBeHistory[] = agent.getHistories();
      try {
        await FileSystemIterator.save({
          root: `${AutoBeExampleStorage.TEST_ROOT}/results/${AutoBeExampleStorage.slugModel(ctx.vendor, false)}/${ctx.project}/${props.phase}`,
          files: {
            ...(await agent.getFiles()),
            ...Object.fromEntries(
              histories
                .filter(
                  (h) =>
                    h.type === "prisma" ||
                    h.type === "interface" ||
                    h.type === "test" ||
                    h.type === "realize",
                )
                .map((h) => [`autobe/${h.type}.instruction.md`, h.instruction]),
            ),
          },
        });
      } catch {}
      await AutoBeExampleStorage.save({
        vendor: ctx.vendor,
        project: ctx.project,
        files: {
          [`${props.phase}.histories.json`]: JSON.stringify(histories),
          [`${props.phase}.snapshots.json`]: JSON.stringify(snapshots),
          [`${props.phase}.error.json`]: null,
        },
      });
      return props.predicate(histories);
    } catch (error) {
      if (error instanceof Error)
        await AutoBeExampleStorage.save({
          vendor: ctx.vendor,
          project: ctx.project,
          files: {
            [`${props.phase}.snapshots.json`]: JSON.stringify(snapshots),
            [`${props.phase}.error.json`]: JSON.stringify({
              ...error,
              name: error.name,
              message: error.message,
              stack: error.stack,
            }),
          },
        });
      throw error;
    }
  };

  const getTrial =
    (props: { project: AutoBeExampleProject; phase: AutoBePhase }) =>
    async (
      conversate: (
        input: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
      ) => Promise<boolean>,
    ): Promise<boolean> =>
      (await conversate(
        await AutoBeExampleStorage.getUserMessage(props).then(
          (r) => r.contents,
        ),
      )) ||
      (await conversate(
        "Don't ask me to do that, and just do it right now.",
      )) ||
      (await conversate(
        `I already told you to do ${props.phase} process. Never ask me anything, and just do it right now. Go go go!`,
      ));

  const getAsset = async (props: {
    vendor: string;
    project: AutoBeExampleProject;
    phase: AutoBePhase;
  }): Promise<IAsset> => {
    const previous: AutoBePhase | null =
      PHASES[PHASES.indexOf(props.phase) - 1] ?? null;
    if (previous === null)
      return {
        histories: [],
        tokenUsage: new AutoBeTokenUsage().toJSON(),
      };
    const histories: AutoBeHistory[] = await AutoBeExampleStorage.getHistories({
      vendor: props.vendor,
      project: props.project,
      phase: previous,
    });
    const tokenUsage: IAutoBeTokenUsageJson =
      await AutoBeExampleStorage.getTokenUsage({
        vendor: props.vendor,
        project: props.project,
        phase: previous,
      });
    return {
      histories,
      tokenUsage,
    };
  };

  interface IAsset {
    histories: AutoBeHistory[];
    tokenUsage: IAutoBeTokenUsageJson;
  }
}

const PHASES: AutoBePhase[] = [
  "analyze",
  "prisma",
  "interface",
  "test",
  "realize",
];
