import { AutoBeAgent, AutoBeTokenUsage } from "@autobe/agent";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAnalyzeReviewEvent,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteEvent,
  AutoBeEvent,
  AutoBeEventSnapshot,
  AutoBeHistory,
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
  if (TestGlobal.env.API_KEY === undefined) return false;

  // PREPARE ASSETS
  const [history]: AutoBeHistory[] = await TestHistory.getInitial(project);
  typia.assertGuard<AutoBeUserMessageHistory>(history);
  const content: string | null =
    history.contents[0].type === "text" ? history.contents[0].text : null;
  if (content === null) throw new Error("History must have a text content.");

  const start: Date = new Date();
  const model: string = TestGlobal.getVendorModel();
  const snapshots: AutoBeEventSnapshot[] = [];

  const agent: AutoBeAgent<ILlmSchema.Model> = factory.createAgent([history]);
  const listen = (event: AutoBeEvent) => {
    if (TestGlobal.archive) TestLogger.event(start, event);
    snapshots.push({
      event,
      tokenUsage: agent.getTokenUsage().toJSON(),
    });
  };
  agent.on("assistantMessage", listen);
  agent.on("jsonParseError", listen);
  agent.on("jsonValidateError", listen);
  for (const type of typia.misc.literals<AutoBeEvent.Type>())
    if (type.startsWith("analyze")) agent.on(type, listen);

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
  const go = (message: string) =>
    agent.conversate(
      [
        message,
        "",
        "Make every determinant by yourself, and just show me the analysis report. call analyze function.",
      ].join("\n"),
    );
  let results: AutoBeHistory[] = await go(content);
  if (results.every((el) => el.type !== "analyze")) {
    results = await go(
      "I'm not familiar with the analyze feature. Please determine everything by yourself, and just show me the analysis report.",
    );
    if (results.every((el) => el.type !== "analyze")) {
      await FileSystemIterator.save({
        root: `${TestGlobal.ROOT}/results/${model}/${project}/analyze-failure`,
        files: {
          "histories.json": JSON.stringify(agent.getHistories(), null, 2),
        },
      });

      console.debug(JSON.stringify(results, null, 2));
      throw new Error("Some history type must be analyze.");
    }
  }

  // REPORT RESULT
  const files: Record<string, string> = await agent.getFiles();
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${model}/${project}/analyze`,
    files,
  });
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
