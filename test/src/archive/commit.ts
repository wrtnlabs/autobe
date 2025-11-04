import { AutoBeAgent } from "@autobe/agent";
import {
  AutoBeExampleStorage,
  AutoBeReplayComputer,
  AutoBeReplayDocumentation,
  AutoBeReplayStorage,
} from "@autobe/benchmark";
import { AutoBeCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  IAutoBePlaygroundBenchmark,
  IAutoBePlaygroundReplay,
} from "@autobe/interface";
import cp from "child_process";
import fs from "fs";
import OpenAI from "openai";

import { TestGlobal } from "../TestGlobal";

const initialize = async (): Promise<void> => {
  if (fs.existsSync(`${TestGlobal.ROOT}/repositories/autobe-examples`) === true)
    return;
  try {
    await fs.promises.mkdir(`${TestGlobal.ROOT}/repositories`, {
      recursive: true,
    });
  } catch {}
  cp.execSync("git clone https://github.com/wrtnlabs/autobe-examples", {
    cwd: `${TestGlobal.ROOT}/repositories`,
    stdio: "inherit",
  });
};

const main = async (): Promise<void> => {
  // INITIALIZE
  await initialize();

  // GATHER DATA
  const bucket: Record<string, string> = {};
  const experiments: IAutoBePlaygroundBenchmark[] = [];
  for (const vendor of await AutoBeExampleStorage.getVendorModels()) {
    const replayList: IAutoBePlaygroundReplay[] =
      await AutoBeReplayStorage.getAll(vendor, (project) =>
        AutoBeReplayComputer.SIGNIFICANT_PROJECTS.includes(project),
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
      AutoBeReplayComputer.summarize,
    );
    experiments.push({
      vendor,
      replays: summaries,
      score: AutoBeReplayComputer.score(summaries),
      emoji: AutoBeReplayComputer.emoji(summaries),
    });
  }
  experiments.sort((a, b) =>
    b.score === a.score
      ? a.vendor.localeCompare(b.vendor)
      : b.score.aggregate - a.score.aggregate,
  );

  // COMMIT
  bucket["README.md"] = AutoBeReplayDocumentation.readme(experiments);
  for (const file of await fs.promises.readdir(
    `${TestGlobal.ROOT}/repositories/autobe-examples`,
  )) {
    const location: string = `${TestGlobal.ROOT}/repositories/autobe-examples/${file}`;
    const stat: fs.Stats = await fs.promises.lstat(location);
    if (stat.isDirectory() === true && file !== ".git")
      await fs.promises.rm(location, {
        recursive: true,
        force: true,
      });
  }
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/repositories/autobe-examples`,
    files: bucket,
    overwrite: true,
  });

  // COMMIT
  if (TestGlobal.getArguments("no-commit") === null) {
    const execute = (command: string) => {
      cp.execSync(command, {
        cwd: `${TestGlobal.ROOT}/repositories/autobe-examples`,
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
