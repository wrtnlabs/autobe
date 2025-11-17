import { AutoBeAgent, AutoBeTokenUsage } from "@autobe/agent";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBeUserMessageContent,
  AutoBeUserMessageHistory,
} from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import typia from "typia";

import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { ArchiveLogger } from "../utils/ArchiveLogger";

export const archive_analyze = async (props: {
  factory: TestFactory;
  project: AutoBeExampleProject;
  vendor: string;
}) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const userMessage: AutoBeUserMessageHistory =
    await AutoBeExampleStorage.getUserMessage({
      project: props.project,
      phase: "analyze",
    });
  const start: Date = new Date();
  const snapshots: AutoBeEventSnapshot[] = [];

  const agent: AutoBeAgent<ILlmSchema.Model> = props.factory.createAgent([]);
  const listen = (event: AutoBeEventOfSerializable) => {
    if (TestGlobal.archive) ArchiveLogger.event(start, event);
    snapshots.push({
      event,
      tokenUsage: agent.getTokenUsage().toJSON(),
    });
  };
  for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, listen);
  agent.on("analyzeScenario", (e) => {
    console.log(e.actors);
  });

  // GENERATE REPORT
  const zero: AutoBeTokenUsage = new AutoBeTokenUsage(
    props.factory.getTokenUsage().toJSON(),
  );
  const go = async (
    c: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
  ): Promise<boolean> => {
    const histories: AutoBeHistory[] = await agent.conversate(c);
    return histories.some((h) => h.type === "analyze");
  };

  try {
    if ((await go(userMessage.contents)) === false)
      if (
        (await go(
          "I'm not familiar with the analyze feature. Please determine everything by yourself, and just show me the analysis report.",
        )) === false
      )
        if (
          (await go(
            "I already told you to publish the analysis report. Never ask me anything, and just do it right now.",
          )) === false
        )
          throw new Error("Some history type must be analyze.");

    // REPORT RESULT
    try {
      await FileSystemIterator.save({
        root: `${TestGlobal.ROOT}/results/${AutoBeExampleStorage.slugModel(props.vendor, false)}/${props.project}/analyze`,
        files: await agent.getFiles(),
      });
    } catch {}
    await AutoBeExampleStorage.save({
      vendor: props.vendor,
      project: props.project,
      files: {
        [`analyze.histories.json`]: JSON.stringify(agent.getHistories()),
        [`analyze.snapshots.json`]: JSON.stringify(
          snapshots.map((s) => ({
            event: s.event,
            tokenUsage: new AutoBeTokenUsage(s.tokenUsage)
              .decrement(zero)
              .toJSON(),
          })),
        ),
        // [`${project}.analyze.writes.json`]: JSON.stringify(
        //   snapshots.map((s) => s.event).filter((e) => e.type === "analyzeWrite"),
        // ),
        // [`${project}.analyze.reviews.json`]: JSON.stringify(
        //   snapshots.map((s) => s.event).filter((e) => e.type === "analyzeReview"),
        // ),
        // [`${project}.analyze.scenario.json`]: JSON.stringify(
        //   snapshots.map((s) => s.event).find((e) => e.type === "analyzeScenario")!,
        // ),
      },
    });
  } catch (error) {
    await AutoBeExampleStorage.save({
      vendor: props.vendor,
      project: props.project,
      files: {
        [`analyze.snapshots.json`]: JSON.stringify(
          snapshots.map((s) => ({
            event: s.event,
            tokenUsage: new AutoBeTokenUsage(s.tokenUsage)
              .decrement(zero)
              .toJSON(),
          })),
        ),
      },
    });
    throw error;
  }
};
