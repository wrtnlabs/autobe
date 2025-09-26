import { AutoBeAgent, AutoBeTokenUsage } from "@autobe/agent";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAnalyzeReviewEvent,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteEvent,
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBeUserMessageContent,
  AutoBeUserMessageHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import typia from "typia";

import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { TestHistory } from "../../internal/TestHistory";
import { TestLogger } from "../../internal/TestLogger";
import { TestProject } from "../../structures/TestProject";

export const archive_analyze = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const userMessage: AutoBeUserMessageHistory =
    await TestHistory.getUserMessage(project, "analyze");
  const start: Date = new Date();
  const model: string = TestGlobal.vendorModel;
  const snapshots: AutoBeEventSnapshot[] = [];

  const agent: AutoBeAgent<ILlmSchema.Model> = factory.createAgent([]);
  const listen = (event: AutoBeEventOfSerializable) => {
    if (TestGlobal.archive) TestLogger.event(start, event);
    snapshots.push({
      event,
      tokenUsage: agent.getTokenUsage().toJSON(),
    });
  };
  for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, listen);

  // FOR NEXT TESTING ASSETS
  let scenario: AutoBeAnalyzeScenarioEvent | null = null;
  const writes: AutoBeAnalyzeWriteEvent[] = [];
  const reviews: AutoBeAnalyzeReviewEvent[] = [];

  agent.on("analyzeScenario", (e) => {
    scenario = e;
  });
  agent.on("analyzeWrite", (e) => {
    writes.push(e);
  });
  agent.on("analyzeReview", (e) => {
    reviews.push(e);
  });

  // GENERATE REPORT
  const zero: AutoBeTokenUsage = new AutoBeTokenUsage(
    factory.getTokenUsage().toJSON(),
  );
  const go = (
    c: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
  ) => agent.conversate(c);

  let histories: AutoBeHistory[] = await go(userMessage.contents);
  if (histories.every((h) => h.type !== "analyze")) {
    histories = await go(
      "I'm not familiar with the analyze feature. Please determine everything by yourself, and just show me the analysis report.",
    );
    if (histories.every((h) => h.type !== "analyze")) {
      await FileSystemIterator.save({
        root: `${TestGlobal.ROOT}/results/${model}/${project}/analyze-failure`,
        files: {
          "histories.json": JSON.stringify(agent.getHistories(), null, 2),
        },
      });
      throw new Error("Some history type must be analyze.");
    }
  }

  // REPORT RESULT
  const files: Record<string, string> = await agent.getFiles();
  try {
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${model}/${project}/analyze`,
      files,
    });
  } catch {}
  if (TestGlobal.archive)
    await TestHistory.save({
      [`${project}.analyze.json`]: JSON.stringify(agent.getHistories()),
      [`${project}.analyze.snapshots.json`]: JSON.stringify(
        snapshots.map((s) => ({
          event: s.event,
          tokenUsage: new AutoBeTokenUsage(s.tokenUsage)
            .decrement(zero)
            .toJSON(),
        })),
      ),
      [`${project}.analyze.writes.json`]: JSON.stringify(writes),
      [`${project}.analyze.reviews.json`]: JSON.stringify(reviews),
      [`${project}.analyze.scenario.json`]: JSON.stringify(scenario),
    });
};
