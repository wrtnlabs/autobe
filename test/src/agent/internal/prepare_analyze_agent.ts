import { AutoBeAgent } from "@autobe/agent";
import { describe } from "@autobe/agent/src/describe/describe";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeCompiler } from "@autobe/compiler";
import { AutoBeExampleProject } from "@autobe/interface";

import { TestGlobal } from "../../TestGlobal";

export const prepare_analyze_agent = async (props: {
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeAgent> => {
  const agent: AutoBeAgent = new AutoBeAgent({
    vendor: TestGlobal.getVendorConfig(),
    compiler: (listener) => new AutoBeCompiler(listener),
  });
  agent.getHistories().push(
    await describe(agent.getContext(), {
      content: await AutoBeExampleStorage.getUserMessage({
        project: props.project,
        phase: "analyze",
      }),
    }),
  );
  return agent;
};
