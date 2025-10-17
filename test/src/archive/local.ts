import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeHistory, AutoBePhase } from "@autobe/interface";
import OpenAI from "openai";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";
import { TestHistory } from "../internal/TestHistory";
import { TestProject } from "../structures/TestProject";

const archive = async (props: {
  vendor: string;
  project: TestProject;
  phase: AutoBePhase;
  dbms: "sqlite" | "postgres";
}): Promise<void> => {
  const histories: AutoBeHistory[] = await TestHistory.getHistories(
    props.project,
    props.phase,
  );
  const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({
        apiKey: "",
      }),
      model: props.vendor,
    },
    compiler: (listener) => new AutoBeCompiler(listener),
    histories,
  });
  const files: Record<string, string> = await agent.getFiles({
    dbms: props.dbms,
  });
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/${props.phase}`,
    files,
  });
};

const main = async (): Promise<void> => {
  const dbms: "sqlite" | "postgres" = typia.assert<"sqlite" | "postgres">(
    TestGlobal.getArguments("dbms")?.[0] ?? "postgres",
  );
  const project = typia.assert<TestProject>(
    TestGlobal.getArguments("project")?.[0],
  );
  for (const phase of typia.misc.literals<AutoBePhase>())
    try {
      await archive({
        vendor: TestGlobal.vendorModel,
        project,
        phase,
        dbms,
      });
    } catch {}
};
main().catch(console.error);
