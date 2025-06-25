import { orchestrateTestScenario } from "@autobe/agent/src/orchestrate/test/orchestrateTestScenario";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeTestScenarioEvent } from "@autobe/interface";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_test } from "./prepare_agent_test";

export const validate_agent_test_scenario = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const { agent } = await prepare_agent_test(factory, project);

  // GENERATE TEST SCENARIOS
  const result: AutoBeTestScenarioEvent = await orchestrateTestScenario(
    agent.getContext(),
  );
  typia.assert(result);

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${project}/test/scenario`,
    files: {
      ...(await agent.getFiles()),
      "logs/scenarios.json": JSON.stringify(result.scenarios, null, 2),
    },
  });
};
