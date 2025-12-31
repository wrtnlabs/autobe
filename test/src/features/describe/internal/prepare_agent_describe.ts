import { AutoBeAgent } from "@autobe/agent";
import { AutoBeState } from "@autobe/agent/src/context/AutoBeState";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";

export const prepare_agent_describe = (props: {
  factory: TestFactory;
  vendor: string;
}) => {
  if (TestGlobal.env.OPENROUTER_API_KEY === undefined)
    throw new Error("No OpenAI API key provided");

  const agent: AutoBeAgent = props.factory.createAgent([]);
  const state: AutoBeState = agent.getContext().state();
  return {
    agent,
    analyze: state.analyze!,
    database: state.database!,
    interface: state.interface!,
    test: state.test!,
  };
};
