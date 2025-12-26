import { AutoBeAgent } from "@autobe/agent";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeCompiler } from "@autobe/compiler";
import { AutoBeExampleProject } from "@autobe/interface";
import { v7 } from "uuid";

import { TestGlobal } from "../../TestGlobal";

export const prepare_test_agent = async (props: {
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeAgent> => {
  const agent: AutoBeAgent = new AutoBeAgent({
    vendor: TestGlobal.getVendorConfig(),
    compiler: (listener) => new AutoBeCompiler(listener),
    histories: await AutoBeExampleStorage.getHistories({
      vendor: props.vendor,
      project: props.project,
      phase: "interface",
    }),
  });
  agent.getHistories().push({
    id: v7(),
    type: "userMessage",
    contents: [
      {
        type: "text",
        text: "Make test functions",
      },
    ],
    created_at: new Date().toISOString(),
  });
  return agent;
};
