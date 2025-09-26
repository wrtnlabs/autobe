import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeHistory } from "@autobe/interface";
import cp from "child_process";
import fs from "fs";
import OpenAI from "openai";
import { Singleton } from "tstl";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";
import { TestHistory } from "../internal/TestHistory";
import { TestProject } from "../structures/TestProject";

const cwd = new Singleton(async () => {
  const location: string = `${TestGlobal.ROOT}/assets/repositories`;
  try {
    await fs.promises.mkdir(location);
  } catch {}
  return location;
});

const commit = async (props: {
  project: TestProject;
  vendor: string;
  files: Record<string, string>;
}): Promise<boolean> => {
  try {
    const name: string = `autobe-example-${props.project}-${props.vendor.split("/").join("-")}`;
    const location: string = `${await cwd.get()}/${name}`;
    if (fs.existsSync(location) === false)
      try {
        cp.execSync(`git clone https://github.com/wrtnlabs/${name}`, {
          cwd: await cwd.get(),
          stdio: "ignore",
        });
      } catch {
        console.log("  - no repository");
        return false;
      }

    const execute = (command: string, ignoreError: boolean = false) => {
      try {
        cp.execSync(command, {
          cwd: location,
          stdio: "ignore",
        });
      } catch (error) {
        if (ignoreError === true) return;
        console.log(`  - failed to execute: ${command}`);
        throw error;
      }
    };
    execute(`git pull`, true);

    for (const file of await fs.promises.readdir(location)) {
      const next: string = `${location}/${file}`;
      const stat: fs.Stats = await fs.promises.lstat(next);
      if (stat.isDirectory() === true) {
        if (file === ".git") continue;
        await fs.promises.rm(next, { recursive: true });
      } else await fs.promises.rm(next);
    }
    await FileSystemIterator.save({
      overwrite: true,
      root: location,
      files: props.files,
    });
    execute("git add .");
    execute(`git commit -m "update generated files"`);
    execute("git push");
    return true;
  } catch {
    return false;
  }
};

const main = async (): Promise<void> => {
  type VendorModel =
    | "openai/gpt-4.1"
    | "openai/gpt-4.1-mini"
    | "openai/gpt-5"
    | "qwen/qwen3-235b-a22b-2507"
    | "qwen/qwen3-next-80b-a3b-instruct";
  for (const vendor of typia.misc.literals<VendorModel>())
    for (const project of typia.misc.literals<TestProject>())
      for (const phase of [
        "realize",
        "test",
        "interface",
        "prisma",
        "analyze",
      ] as const) {
        TestGlobal.vendorModel = vendor;
        if ((await TestHistory.has(project, phase)) === false) continue;

        const histories: AutoBeHistory[] = await TestHistory.getHistories(
          project,
          phase,
        );
        const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
          model: "chatgpt",
          vendor: {
            api: new OpenAI({
              apiKey: "",
            }),
            model: vendor,
          },
          compiler: (listener) => new AutoBeCompiler(listener),
          histories,
        });
        console.log(vendor, project, phase);
        const success: boolean = await commit({
          project,
          vendor,
          files: await agent.getFiles({ dbms: "sqlite" }),
        });
        console.log("  - success", success);
        break;
      }
};
main().catch((error) => {
  console.log(error);
  process.exit(-11);
});
