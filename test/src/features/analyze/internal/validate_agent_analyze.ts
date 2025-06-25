import { AutoBeAgent, orchestrate } from "@autobe/agent";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAnalyzeHistory,
  AutoBeAssistantMessageHistory,
  AutoBeHistory,
  AutoBeUserMessageHistory,
} from "@autobe/interface";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestProject } from "../../../structures/TestProject";

export const validate_agent_analyze = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const [history]: AutoBeHistory[] = await TestHistory.getAnalyze(project);
  typia.assertGuard<AutoBeUserMessageHistory>(history);

  const agent: AutoBeAgent<"chatgpt"> = factory.createAgent([history]);

  // GENERATE REPORT
  const go = (reason: string) =>
    orchestrate.analyze({
      ...agent.getContext(),
    })({
      reason,
    });
  let result: AutoBeAssistantMessageHistory | AutoBeAnalyzeHistory = await go(
    "The user requested the preparation of the plan.",
  );
  if (result.type !== "analyze") {
    result = await go("Don't ask me to do that, and just do it right now.");
    if (result.type !== "analyze")
      throw new Error("History type must be analyze.");
  }

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${project}/analyze`,
    files: {
      ...(await agent.getFiles()),
      "logs/result.json": JSON.stringify(result, null, 2),
    },
  });
};
