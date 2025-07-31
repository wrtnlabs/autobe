import { AutoBeAgent } from "@autobe/agent";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEvent,
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBeUserMessageHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestProject } from "../../../structures/TestProject";

export const validate_agent_analyze_main = async (
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

  const agent: AutoBeAgent<ILlmSchema.Model> = factory.createAgent([history]);
  const model: string = TestGlobal.getVendorModel();
  const snapshots: AutoBeEventSnapshot[] = [];
  const listen = (event: AutoBeEvent) => {
    snapshots.push({
      event,
      tokenUsage: agent.getTokenUsage().toJSON(),
    });
  };
  agent.on("analyzeStart", listen);
  agent.on("analyzeWrite", listen);
  agent.on("analyzeReview", listen);
  agent.on("analyzeComplete", listen);

  // GENERATE REPORT
  const go = (message: string) =>
    agent.conversate(
      [
        message,
        "",
        "Make every determinant by yourself, and just show me the analysis report.",
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
      throw new Error("Some history type must be analyze.");
    }
  }

  // REPORT RESULT
  const files: Record<string, string> = await agent.getFiles();
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${model}/${project}/analyze`,
    files,
  });
  if (process.argv.includes("--archive"))
    await TestHistory.save({
      [`${project}.analyze.json`]: JSON.stringify(agent.getHistories()),
      [`${project}.analyze.snapshots.json`]: JSON.stringify(snapshots),
    });
};
