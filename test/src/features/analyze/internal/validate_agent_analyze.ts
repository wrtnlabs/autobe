import { orchestrate } from "@autobe/agent";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAnalyzeHistory,
  AutoBeAssistantMessageHistory,
} from "@autobe/interface";
import { promises } from "fs";
import path from "path";
import typia from "typia";

import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_analyze } from "./prepare_agent_analyze";

export const validate_agent_analyze = async (
  owner: "samchon" | "kakasoo",
  project: "bbs-backend" | "shopping-backend" | "sns-backend",
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  const { agent } = await prepare_agent_analyze(project);

  const history: AutoBeAssistantMessageHistory | AutoBeAnalyzeHistory =
    await orchestrate.analyze({
      ...agent.getContext(),
    })({
      reason: "The user requested the preparation of the plan.",
      userPlanningRequirements: await promises.readFile(
        path.join(__dirname, `./${project}.user_planning_requirement.md`),
        {
          encoding: "utf-8",
        },
      ),
    });

  typia.assertGuard<"analyze">(history.type);
  typia.assertEquals(history.files);

  if (JSON.stringify(history.files) === "{}") {
    throw new Error("Analyze cannot generate files.");
  }

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${owner}/${project}/prisma`,
    files: {
      ...(await agent.getFiles()),
      "logs/result.json": JSON.stringify(history, null, 2),
      "logs/files.json": JSON.stringify(Object.keys(agent.getFiles()), null, 2),
      "logs/tokenUsage.json": JSON.stringify(agent.getTokenUsage(), null, 2),
    },
  });
};
