import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  IAutoBePlaygroundBenchmark,
  IAutoBePlaygroundReplay,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import cp from "child_process";
import fs from "fs";
import OpenAI from "openai";

import { TestGlobal } from "../TestGlobal";
import { TestHistory } from "../internal/TestHistory";
import { TestProject } from "../structures/TestProject";
import { AutoBePlaygroundReplayComputer } from "./utils/AutoBePlaygroundReplayComputer";
import { AutoBePlaygroundReplayStorage } from "./utils/AutoBePlaygroundReplayStorage";

const initialize = async (): Promise<void> => {
  if (fs.existsSync(`${TestGlobal.ROOT}/repositories/examples`) === true)
    return;
  try {
    await fs.promises.mkdir(`${TestGlobal.ROOT}/repositories`, {
      recursive: true,
    });
  } catch {}
  cp.execSync(
    "git clone https://github.com/wrtnlabs/autobe-examples examples",
    {
      cwd: `${TestGlobal.ROOT}/repositories`,
      stdio: "inherit",
    },
  );
};

const readme = (experiments: IAutoBePlaygroundBenchmark[]): string => {
  const section = (exp: IAutoBePlaygroundBenchmark): string => {
    const row = (project: TestProject): string => {
      const found = exp.replays.find((r) => r.project === project);
      if (found === undefined)
        return `\`${project}\` | 0 | ❌ | ❌ | ❌ | ❌ | ❌`;
      const phase = (
        state: IAutoBePlaygroundReplay.IPhaseState | null,
      ): string => {
        if (state === null) return "❌";
        else if (state.success === false) return "🟡";
        else return "🟢";
      };
      return [
        `[\`${found.project}\`](./${exp.vendor}/${found.project}/)`,
        (exp.score as any)[project],
        phase(found.analyze),
        phase(found.prisma),
        phase(found.interface),
        phase(found.test),
        phase(found.realize),
      ].join(" | ");
    };

    return StringUtil.trim`
      ## \`${exp.vendor}\`
      
      Project | Score | Analyze | Prisma | Interface | Test | Realize
      :-------|------:|:-------:|:------:|:----------|:----:|:-------:
      ${row("todo")}
      ${row("bbs")}
      ${row("reddit")}
      ${row("shopping")}

      ![](https://autobe.dev/images/demonstrate/replay-${TestHistory.slugModel(
        exp.vendor,
        true,
      )}.png)
    `;
  };
  return StringUtil.trim`
    # AutoBe Generated Examples

    ## Benchmark

    AI Model | Score | Status 
    :--------|------:|:------:
    ${experiments
      .map((e) =>
        [
          `[\`${TestHistory.slugModel(
            e.vendor,
            false,
          )}\`](#${TestHistory.slugModel(e.vendor, true)})`,
          e.score.aggregate,
          e.emoji,
        ].join(" | "),
      )
      .join("\n")}

    ${experiments.map(section).join("\n\n")}
  `;
};

const main = async (): Promise<void> => {
  // INITIALIZE
  await initialize();

  // GATHER DATA
  const bucket: Record<string, string> = {};
  const experiments: IAutoBePlaygroundBenchmark[] = [];
  for (const vendor of await AutoBePlaygroundReplayStorage.getVendorModels()) {
    const replayList: IAutoBePlaygroundReplay[] =
      await AutoBePlaygroundReplayStorage.getAll(vendor, (project) =>
        AutoBePlaygroundReplayComputer.SIGNIFICANT_PROJECTS.includes(project),
      );
    if (replayList.length === 0) continue;
    for (const replay of replayList) {
      const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
        model: "chatgpt",
        vendor: {
          api: new OpenAI({
            apiKey: "",
          }),
          model: vendor,
        },
        compiler: (listener) => new AutoBeCompiler(listener),
        histories: replay.histories,
      });
      const files: Record<string, string> = await agent.getFiles({
        dbms: "sqlite",
      });
      for (const [k, v] of Object.entries(files))
        bucket[`${replay.vendor}/${replay.project}/${k}`] = v;
    }

    const summaries: IAutoBePlaygroundReplay.ISummary[] = replayList.map(
      AutoBePlaygroundReplayComputer.summarize,
    );
    experiments.push({
      vendor,
      replays: summaries,
      score: AutoBePlaygroundReplayComputer.score(summaries),
      emoji: AutoBePlaygroundReplayComputer.emoji(summaries),
    });
  }
  experiments.sort((a, b) =>
    b.score === a.score
      ? a.vendor.localeCompare(b.vendor)
      : b.score.aggregate - a.score.aggregate,
  );

  // COMMIT
  bucket["README.md"] = readme(experiments);
  for (const file of await fs.promises.readdir(
    `${TestGlobal.ROOT}/repositories/examples`,
  )) {
    const location: string = `${TestGlobal.ROOT}/repositories/examples/${file}`;
    const stat: fs.Stats = await fs.promises.lstat(location);
    if (stat.isDirectory() === true && file !== ".git")
      await fs.promises.rm(location, {
        recursive: true,
        force: true,
      });
  }
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/repositories/examples`,
    files: bucket,
    overwrite: true,
  });

  // COMMIT
  if (TestGlobal.getArguments("no-commit") === null) {
    const execute = (command: string) => {
      cp.execSync(command, {
        cwd: `${TestGlobal.ROOT}/repositories/examples`,
        stdio: "ignore",
      });
    };
    execute("git add .");
    execute(`git commit -m "update generated files"`);
    execute("git push");
  }
};
main().catch((error) => {
  console.log(error);
  process.exit(-11);
});
