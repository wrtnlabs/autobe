import { orchestrateTestScenario } from "@autobe/agent/src/orchestrate/test/orchestrateTestScenario";
import { AutoBeEvent } from "@autobe/interface";
import typia from "typia";

import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_test } from "./prepare_agent_test";

export const validate_agent_test_scenario = async (
  _owner: string,
  project: "bbs",
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  const { agent } = await prepare_agent_test(project);

  const events: AutoBeEvent[] = [];
  agent.on("testStart", (event) => {
    events.push(event);
  });
  agent.on("testScenario", (event) => {
    events.push(event);
  });
  agent.on("testComplete", (event) => {
    events.push(event);
  });

  const result = await orchestrateTestScenario(agent.getContext());
  typia.assert(result);
  return result;
};
