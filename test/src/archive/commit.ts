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
  cp.execSync("git config core.longpaths true", {
    cwd: AutoBeExampleStorage.repository(),
    stdio: "inherit",
  });
  if (process.argv.includes("--reset") === true)
    for (const file of await fs.promises.readdir(
      AutoBeExampleStorage.repository(),
    )) {
      const location: string = `${AutoBeExampleStorage.repository()}/${file}`;
      const stat: fs.Stats = await fs.promises.lstat(location);
      if (stat.isDirectory() === true && file !== ".git" && file !== "raw") {
        await fs.promises.rm(location, {
          recursive: true,
          force: true,
        });
      }
    }
};

const main = async (): Promise<void> => {
  // INITIALIZE
  initialize();

  // GATHER DATA
  const experiments: IAutoBePlaygroundBenchmark[] = [];
  for (const vendor of await AutoBeExampleStorage.getVendorModels()) {
    const replayList: IAutoBePlaygroundReplay[] =
      await AutoBeReplayStorage.getAll(vendor, (project) =>
        AutoBeReplayComputer.SIGNIFICANT_PROJECTS.includes(project),
      );
    if (replayList.length === 0) continue;
    for (const replay of replayList) {
      const agent: AutoBeAgent = new AutoBeAgent({
        vendor: {
          api: new OpenAI({
            apiKey: "",
          }),
          model: vendor,
        },
        compiler: (listener) => new AutoBeCompiler(listener),
        histories: replay.histories,
      });
      await FileSystemIterator.save({
        root: `${AutoBeExampleStorage.repository()}/${replay.vendor}/${replay.project}`,
        files: await agent.getFiles({
          dbms: "sqlite",
        }),
        overwrite: false,
      });
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
  await fs.promises.writeFile(
    `${AutoBeExampleStorage.repository()}/README.md`,
    AutoBeReplayDocumentation.readme(experiments),
    "utf8",
  );

  // COMMIT
  if (TestGlobal.getArguments("no-commit") === null) {
    const execute = (command: string) => {
      cp.execSync(command, {
        cwd: AutoBeExampleStorage.repository(),
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
