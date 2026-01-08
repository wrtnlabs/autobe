import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAggregateEventBase,
  AutoBeDatabaseHistory,
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeExampleProject,
  AutoBeHistory,
  AutoBePhase,
  AutoBeProcessAggregateCollection,
  AutoBeUserConversateContent,
  IAutoBeAgent,
  IAutoBePlaygroundReplay,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import {
  AutoBeProcessAggregateFactory,
  TokenUsageComputer,
} from "@autobe/utils";
import typia from "typia";

import { AutoBeReplayComputer } from "../replay";
import { AutoBeExampleStorage } from "./AutoBeExampleStorage";

export namespace AutoBeExampleArchiver {
  export interface IContext {
    vendor: string;
    project: AutoBeExampleProject;
    imagePath?: string;
    agent: (props: IAgentProps) => Promise<IAutoBeAgent>;
    on: (snapshot: AutoBeEventSnapshot) => void;
  }

  export interface IAgentProps {
    vendor: string;
    histories: AutoBeHistory[];
    tokenUsage: IAutoBeTokenUsageJson;
  }

  export const archiveAnalyze = (ctx: IContext): Promise<boolean> =>
    archive(ctx, {
      phase: "analyze",
      trial: async (conversate): Promise<boolean> =>
        (await conversate(
          await AutoBeExampleStorage.getUserMessage({
            project: ctx.project,
            phase: "analyze",
            imagePath: ctx.imagePath,
          }),
        )) ||
        (await conversate(
          "I'm not familiar with the analyze feature. Please determine everything by yourself, and just show me the analysis report.",
        )) ||
        (await conversate(
          "I already told you to publish the analysis report. Never ask me anything, and just do anything right now by your decision.",
        )) ||
        (await conversate(
          "Call analyze() function right now, never ask me anything again. You can do whatever you want.",
        )),
      predicate: (histories): boolean =>
        histories.some((h) => h.type === "analyze"),
    });

  export const archivePrisma = (ctx: IContext): Promise<boolean> =>
    archive(ctx, {
      phase: "database",
      trial: getTrial({
        project: ctx.project,
        phase: "database",
      }),
      predicate: (histories): boolean => {
        const prisma: AutoBeDatabaseHistory | undefined = histories.find(
          (h) => h.type === "database",
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
          input:
            | string
            | AutoBeUserConversateContent
            | AutoBeUserConversateContent[],
        ) => Promise<boolean>,
      ) => Promise<boolean>;
      predicate: (histories: AutoBeHistory[]) => boolean;
    },
  ): Promise<boolean> => {
    // INITIALIZE AGENT
    const asset: IAgentProps = await getAsset({
      vendor: ctx.vendor,
      project: ctx.project,
      phase: props.phase,
    });
    const agent: IAutoBeAgent = await ctx.agent(asset);
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

    const summarize = async (
      histories: AutoBeHistory[],
      error: boolean,
    ): Promise<void> => {
      const replay: IAutoBePlaygroundReplay = {
        vendor: ctx.vendor,
        project: ctx.project,
        histories,
        analyze: null,
        database: null,
        interface: null,
        test: null,
        realize: null,
      };
      for (const phase of PHASES)
        if (phase === props.phase) {
          replay[phase] = snapshots;
          break;
        } else
          replay[phase] = await AutoBeExampleStorage.getSnapshots({
            vendor: ctx.vendor,
            project: ctx.project,
            phase,
          });
      const summary: IAutoBePlaygroundReplay.ISummary =
        AutoBeReplayComputer.summarize(replay);
      if (error === true) {
        const aggregates: AutoBeProcessAggregateCollection =
          AutoBeProcessAggregateFactory.createCollection();
        for (const { event } of snapshots) {
          if (typia.is<AutoBeAggregateEventBase>(event) === false) continue;
          AutoBeProcessAggregateFactory.emplaceEvent(aggregates, event);
        }
        summary[props.phase] = {
          aggregates,
          success: false,
          elapsed: 0,
          commodity: {},
        };
      }
      await AutoBeExampleStorage.save({
        vendor: ctx.vendor,
        project: ctx.project,
        files: {
          [`summary.json`]: JSON.stringify(summary),
        },
      });
    };

    try {
      // CONVERSATE
      const go = async (
        c: string | AutoBeUserConversateContent | AutoBeUserConversateContent[],
      ): Promise<boolean> => {
        const result: AutoBeHistory[] = await agent.conversate(c);
        return (
          result.some((h) => h.type === props.phase) ||
          result.every((h) => h.type !== "assistantMessage")
        );
      };

      const done: boolean = await props.trial(go);
      const histories: AutoBeHistory[] = agent.getHistories();
      if (
        done === false ||
        histories.some((h) => h.type === props.phase) === false
      )
        throw new Error(
          `Failed to function calling in the "${props.phase}" phase of the "${ctx.project}" project.`,
        );

      // AGGREGATE
      try {
        await FileSystemIterator.save({
          root: `${
            AutoBeExampleStorage.TEST_ROOT
          }/results/${AutoBeExampleStorage.slugModel(ctx.vendor, false)}/${
            ctx.project
          }/${props.phase}`,
          files: {
            ...(await agent.getFiles()),
            ...Object.fromEntries(
              histories
                .filter(
                  (h) =>
                    h.type === "database" ||
                    h.type === "interface" ||
                    h.type === "test" ||
                    h.type === "realize",
                )
                .map((h) => [`autobe/${h.type}.instruction.md`, h.instruction]),
            ),
            "pnpm-workspace.yaml": "",
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
      await summarize([...asset.histories, ...histories], false);
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
      await summarize(asset.histories, true);
      throw error;
    }
  };

  const getTrial =
    (props: { project: AutoBeExampleProject; phase: AutoBePhase }) =>
    async (
      conversate: (
        input:
          | string
          | AutoBeUserConversateContent
          | AutoBeUserConversateContent[],
      ) => Promise<boolean>,
    ): Promise<boolean> =>
      (await conversate(await AutoBeExampleStorage.getUserMessage(props))) ||
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
  }): Promise<IAgentProps> => {
    const previous: AutoBePhase | null =
      PHASES[PHASES.indexOf(props.phase) - 1] ?? null;
    if (previous === null)
      return {
        vendor: props.vendor,
        histories: [],
        tokenUsage: {
          aggregate: TokenUsageComputer.zero(),
          facade: TokenUsageComputer.zero(),
          analyze: TokenUsageComputer.zero(),
          database: TokenUsageComputer.zero(),
          interface: TokenUsageComputer.zero(),
          test: TokenUsageComputer.zero(),
          realize: TokenUsageComputer.zero(),
        },
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
      vendor: props.vendor,
      histories,
      tokenUsage,
    };
  };
}

const PHASES: AutoBePhase[] = [
  "analyze",
  "database",
  "interface",
  "test",
  "realize",
];
