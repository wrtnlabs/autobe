import { orchestrate } from "@autobe/agent";
import { AutoBeEvent } from "@autobe/interface";
import typia from "typia";

import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_test } from "./prepare_agent_test";

export const validate_agent_test_scenario = async (
  owner: string,
  project: string,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  const { agent } = await prepare_agent_test(owner, project);

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

  const result = await orchestrate.testScenario(agent.getContext());
  typia.assert(result);
  return result;
};
