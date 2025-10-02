import { AutoBeAgent } from "@autobe/agent";
import { compileRealizeFiles } from "@autobe/agent/src/orchestrate/realize/internal/compileRealizeFiles";
import { AutoBeCompiler } from "@autobe/compiler";
import {
  AutoBeHistory,
  AutoBeRealizeHistory,
  AutoBeRealizeValidateEvent,
} from "@autobe/interface";

import { TestGlobal } from "../TestGlobal";
import { TestHistory } from "../internal/TestHistory";
import { TestProject } from "../structures/TestProject";

const compile = async (props: {
  vendor: string;
  project: TestProject;
}): Promise<void> => {
  TestGlobal.vendorModel = props.vendor;

  const histories: AutoBeHistory[] = await TestHistory.getHistories(
    props.project,
    "realize",
  );
  const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
    model: "chatgpt",
    vendor: TestGlobal.getVendorConfig(),
    config: {
      locale: "en-US",
      timeout: null,
    },
    compiler: (listener) => new AutoBeCompiler(listener),
    histories,
  });

  const realize: AutoBeRealizeHistory = agent.getContext().state().realize!;
  const event: AutoBeRealizeValidateEvent = await compileRealizeFiles(
    agent.getContext(),
    {
      authorizations: realize.authorizations,
      functions: realize.functions,
    },
  );
  console.log(event.result.type);
};

const main = async (): Promise<void> => {
  await compile({
    vendor: "openai/gpt-5",
    project: "bbs",
  });
};
main().catch(console.error);
