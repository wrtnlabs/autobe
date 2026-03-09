import { AutoBeAgent } from "@autobe/agent";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeExampleProject,
  AutoBeHistory,
  AutoBeRealizeHistory,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { MapUtil } from "@nestia/e2e";
import cp from "child_process";
import fs from "fs";
import path from "path";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";

const debug = (props: {
  vendor: string;
  project: AutoBeExampleProject;
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
  location: string;
}): void => {
  const dict: Map<string, string[]> = new Map();
  for (const d of props.diagnostics) {
    if (d.file === null) continue;
    MapUtil.take(dict, d.file, () => []).push(d.messageText);
  }

  const content: string = StringUtil.trim`
    ## \`${props.vendor}\` - \`${props.project}\`

    Total ${dict.size} compile errors.

    ### Location

    \`\`\`bash
    code ${props.location}
    \`\`\`

    ${Array.from(dict.entries())
      .map(
        ([k, v]) => StringUtil.trim`
        ### \`${k}\`
        ${v.map((m) => `- ${m}`).join("\n")}
      `,
      )
      .join("\n\n")}
  `;
  console.log(content, "\n");
};

const visit = async (props: {
  dbms: "sqlite" | "postgres";
  vendor: string;
  project: AutoBeExampleProject;
}): Promise<void> => {
  if (
    false ===
    (await AutoBeExampleStorage.has({
      vendor: props.vendor,
      project: props.project,
      phase: "realize",
    }))
  )
    return;

  // GET ASSETS
  const histories: AutoBeHistory[] = await AutoBeExampleStorage.getHistories({
    project: props.project,
    vendor: props.vendor,
    phase: "realize",
  });
  const realize: AutoBeRealizeHistory | undefined = histories.find(
    (h) => h.type === "realize",
  );
  if (realize === undefined || realize.compiled.type !== "failure") return;

  // REPORT DEBUGGING RESULT
  const location: string = path
    .resolve(
      `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/realize`,
    )
    .replaceAll(path.sep, "/");
  debug({
    vendor: props.vendor,
    project: props.project,
    diagnostics: realize.compiled.diagnostics,
    location,
  });

  // ARCHIVE
  const agent: AutoBeAgent = new AutoBeAgent({
    vendor: TestGlobal.getVendorConfig(),
    compiler: (listener) => new AutoBeCompiler(listener),
    histories,
  });
  const files: Record<string, string> = await agent.getFiles({
    dbms: props.dbms,
  });
  await FileSystemIterator.save({
    root: location,
    files: {
      ...files,
      "pnpm-workspace.yaml": "",
    },
  });
  cp.execSync("pnpm install", {
    stdio: "ignore",
    cwd: location,
  });
};

const main = async (): Promise<void> => {
  const dbms: "sqlite" | "postgres" = typia.assert<"sqlite" | "postgres">(
    TestGlobal.getArguments("dbms")?.[0] ?? "postgres",
  );
  if (fs.existsSync(`${TestGlobal.ROOT}/raw`))
    await fs.promises.rmdir(`${TestGlobal.ROOT}/raw`, {
      recursive: true,
    });
  for (const vendor of await AutoBeExampleStorage.getVendorModels())
    for (const project of typia.misc.literals<AutoBeExampleProject>())
      await visit({
        dbms,
        vendor,
        project,
      });
};
main().catch(console.error);
