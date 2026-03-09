import { AutoBeAgent } from "@autobe/agent";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeHistory, AutoBePhase } from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import OpenAI from "openai";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";

const archive = async (props: {
  vendor: string;
  project: AutoBeExampleProject;
  phase: AutoBePhase;
  dbms: "sqlite" | "postgres";
}): Promise<void> => {
  const histories: AutoBeHistory[] = await AutoBeExampleStorage.getHistories({
    vendor: props.vendor,
    project: props.project,
    phase: props.phase,
  });
  const agent: AutoBeAgent = new AutoBeAgent({
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
    files: {
      ...files,
      "pnpm-workspace.yaml": "",
    },
  });
};

const main = async (): Promise<void> => {
  const dbms: "sqlite" | "postgres" = typia.assert<"sqlite" | "postgres">(
    TestGlobal.getArguments("dbms")?.[0] ?? "postgres",
  );
  for (const project of typia.misc.literals<AutoBeExampleProject>())
    for (const phase of typia.misc.literals<AutoBePhase>()) {
      if (
        false ===
        (await AutoBeExampleStorage.has({
          vendor: TestGlobal.vendorModel,
          project,
          phase,
        }))
      )
        continue;
      await archive({
        vendor: TestGlobal.vendorModel,
        project,
        phase,
        dbms,
      });
    }
};
main().catch(console.error);
