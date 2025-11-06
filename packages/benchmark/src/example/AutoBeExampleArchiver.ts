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
  export const archiveAnalyze = (props: {
    vendor: string;
    project: AutoBeExampleProject;
    agent: (histories: AutoBeHistory[]) => Promise<IAutoBeAgent>;
  }): Promise<void> =>
    archive({
      ...props,
      phase: "analyze",
      trial: async (conversate): Promise<boolean> =>
        (await conversate(
          await AutoBeExampleStorage.getUserMessage({
            project: props.project,
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

  export const archivePrisma = (props: {
    vendor: string;
    project: AutoBeExampleProject;
    agent: (histories: AutoBeHistory[]) => Promise<IAutoBeAgent>;
  }): Promise<void> =>
    archive({
      ...props,
      phase: "prisma",
      trial: getTrial({
        project: props.project,
        phase: "prisma",
      }),
      predicate: (histories): boolean => {
        const prisma: AutoBePrismaHistory | undefined = histories.find(
          (h) => h.type === "prisma",
        );
        return prisma !== undefined && prisma.compiled.type === "success";
      },
    });

  export const archiveInterface = (props: {
    vendor: string;
    project: AutoBeExampleProject;
    agent: (histories: AutoBeHistory[]) => Promise<IAutoBeAgent>;
  }): Promise<void> =>
    archive({
      ...props,
      phase: "interface",
      trial: getTrial({
        project: props.project,
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

  export const archiveTest = (props: {
    vendor: string;
    project: AutoBeExampleProject;
    agent: (histories: AutoBeHistory[]) => Promise<IAutoBeAgent>;
  }): Promise<void> =>
    archive({
      ...props,
      phase: "test",
      trial: getTrial({
        project: props.project,
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

  export const archiveRealize = (props: {
    vendor: string;
    project: AutoBeExampleProject;
    agent: (histories: AutoBeHistory[]) => Promise<IAutoBeAgent>;
  }): Promise<void> =>
    archive({
      ...props,
      phase: "realize",
      trial: getTrial({
        project: props.project,
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

  const archive = async (props: {
    vendor: string;
    project: AutoBeExampleProject;
    phase: AutoBePhase;
    agent: (histories: AutoBeHistory[]) => Promise<IAutoBeAgent>;
    trial: (
      conversate: (
        input: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
      ) => Promise<boolean>,
    ) => Promise<boolean>;
    predicate: (histories: AutoBeHistory[]) => boolean;
  }): Promise<void> => {
    const preliminary: IPreliminary = await getPreliminary(props);
    const agent: IAutoBeAgent = await props.agent(preliminary.histories);
    const snapshots: AutoBeEventSnapshot[] = [];
    for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>()) {
      agent.on(type, (e) => {
        snapshots.push({
          event: e,
          tokenUsage: agent.getTokenUsage(),
        });
      });
    }

    const go = async (
      c: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
    ): Promise<boolean> => {
      const result: AutoBeHistory[] = await agent.conversate(c);
      return result.some((h) => h.type === props.phase);
    };
    const done: boolean = await props.trial(go);
    if (done === false)
      throw new Error(
        `Failed to function calling in the "${props.phase}" phase of the "${props.project}" project.`,
      );

    const histories: AutoBeHistory[] = agent.getHistories();
    try {
      await FileSystemIterator.save({
        root: `${AutoBeExampleStorage.TEST_ROOT}/results/${AutoBeExampleStorage.slugModel(props.vendor, false)}/${props.project}/${props.phase}`,
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
      vendor: props.vendor,
      project: props.project,
      files: {
        [`${props.phase}.histories.json`]: JSON.stringify(histories),
        [`${props.phase}.snapshots.json`]: JSON.stringify(snapshots),
      },
    });
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

  const getPreliminary = async (props: {
    vendor: string;
    project: AutoBeExampleProject;
    phase: AutoBePhase;
  }): Promise<IPreliminary> => {
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

  interface IPreliminary {
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
