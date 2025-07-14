import { AutoBeAgent } from "@autobe/agent";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeHistory, AutoBeUserMessageHistory } from "@autobe/interface";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestProject } from "../../../structures/TestProject";

export const validate_agent_analyze_main = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const [history]: AutoBeHistory[] = await TestHistory.getAnalyze(project);
  typia.assertGuard<AutoBeUserMessageHistory>(history);
  const content: string | null =
    history.contents[0].type === "text" ? history.contents[0].text : null;
  if (content === null) throw new Error("History must have a text content.");

  const agent: AutoBeAgent<"chatgpt"> = factory.createAgent([history]);

  // GENERATE REPORT
  const go = (message: string) => agent.conversate(message);

  let results: AutoBeHistory[] = await go(content);

  if (results.every((el) => el.type !== "analyze")) {
    results = await go("Don't ask me to do that, and just do it right now.");
    if (results.every((el) => el.type !== "analyze"))
      throw new Error("Some history type must be analyze.");
  }

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${project}/analyze`,
    files: {
      ...(await agent.getFiles()),
      "logs/result.json": JSON.stringify(
        results.find((el) => el.type === "analyze"),
        null,
        2,
      ),
    },
  });
  if (process.argv.includes("--archive"))
    await fs.promises.writeFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.analyze.json`,
      JSON.stringify(agent.getHistories(), null, 2),
      "utf8",
    );
};
