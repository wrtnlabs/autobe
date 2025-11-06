import { AutoBeTokenUsage } from "@autobe/agent";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeExampleProject,
  AutoBeHistory,
  AutoBePhase,
  AutoBeUserMessageContent,
  IAutoBeAgent,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import typia from "typia";

import { AutoBeExampleStorage } from "./AutoBeExampleStorage";

export namespace AutoBeExampleArchive {
  export const archive = async (props: {
    vendor: string;
    project: AutoBeExampleProject;
    phase: AutoBePhase;
    agent: (histories: AutoBeHistory[]) => Promise<IAutoBeAgent>;
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
    let done: boolean = await go(
      await AutoBeExampleStorage.getUserMessage({
        project: props.project,
        phase: props.phase,
      }).then((h) => h.contents),
    );
    if (done === false)
      if (props.phase === "analyze") {
        done = await go(
          "I'm not familiar with the analyze feature. Please determine everything by yourself, and just show me the analysis report.",
        );
        if (done === false)
          done = await go(
            "I already told you to publish the analysis report. Never ask me anything, and just do it right now.",
          );
      } else
        done = await go("Don't ask me to do that, and just do it right now.");
    if (done === false)
      throw new Error(
        `Failed to function calling. None history type is ${props.phase}.`,
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
