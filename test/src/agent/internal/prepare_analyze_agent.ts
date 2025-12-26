import { AutoBeAgent } from "@autobe/agent";
import { describe } from "@autobe/agent/src/describe/describe";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeCompiler } from "@autobe/compiler";
import {
  AutoBeEventOfSerializable,
  AutoBeExampleProject,
} from "@autobe/interface";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";
import { ArchiveLogger } from "../../archive/utils/ArchiveLogger";

export const prepare_analyze_agent = async (props: {
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<AutoBeAgent> => {
  const start: Date = new Date();
  const agent: AutoBeAgent = new AutoBeAgent({
    vendor: TestGlobal.getVendorConfig(),
    compiler: (listener) => new AutoBeCompiler(listener),
  });
  for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, (event) => ArchiveLogger.event(start, event));

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
