import { AutoBeTokenUsage } from "@autobe/agent";
import { CompressUtil } from "@autobe/filesystem";
import {
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBePhase,
  AutoBeUserMessageHistory,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import cp from "child_process";
import fs from "fs";
import { Singleton } from "tstl";
import { v7 } from "uuid";

import { TestGlobal } from "../../TestGlobal";
import { TestFileSystem } from "../../internal/TestFileSystem";
import { TestProject } from "../../structures/TestProject";

export namespace ArchiveStorage {
  export const repository = (): string => examples.get();
  export const getDirectory = (props: {
    vendor: string;
    project: string;
  }): string =>
    `${examples.get()}/raw/${slugModel(props.vendor, false)}/${props.project}`;

  export const save = async (props: {
    vendor: string;
    project: TestProject;
    files: Record<string, string>;
  }): Promise<void> => {
    await TestFileSystem.save({
      root: `${getDirectory(props)}`,
      files: props.files,
      overwrite: true,
    });
  };

  export const getUserMessage = async (props: {
    project: TestProject;
    phase: AutoBePhase;
  }): Promise<AutoBeUserMessageHistory> => {
    const full: string = `${TestGlobal.ROOT}/scripts/${props.project}/${props.phase}`;
    if (fs.existsSync(`${full}.md`) === false) {
      const text: string =
        props.phase === "analyze"
          ? await fs.promises.readFile(
              `${TestGlobal.ROOT}/scripts/${props.project}.md`,
              "utf8",
            )
          : PROMPT_TEMPLATE[props.phase];
      return {
        type: "userMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        contents: [
          {
            type: "text",
            text,
          },
        ],
      };
    }
    const text: string = await fs.promises.readFile(`${full}.md`, "utf8");
    return {
      type: "userMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      contents: [
        {
          type: "text",
          text: text,
        },
      ],
    };
  };

  export const getVendorModels = async (): Promise<string[]> => {
    const result: string[] = [];
    const repoPath: string = repository();
    for (const vendor of await fs.promises.readdir(repoPath))
      for (const model of await fs.promises.readdir(`${repoPath}/${vendor}`)) {
        const stat: fs.Stats = await fs.promises.lstat(
          `${repoPath}/${vendor}/${model}`,
        );
        if (stat.isDirectory() === true) result.push(`${vendor}/${model}`);
      }
    return result.sort();
  };

  export const getHistories = async (props: {
    vendor: string;
    project: TestProject;
    phase: AutoBePhase;
  }): Promise<AutoBeHistory[]> => {
    const location: string = `${getDirectory(props)}/${props.phase}.histories.json.gz`;
    const content: string = await CompressUtil.gunzip(
      await fs.promises.readFile(location),
    );
    return JSON.parse(content);
  };

  export const getSnapshots = async (props: {
    vendor: string;
    project: TestProject;
    phase: AutoBePhase;
  }): Promise<AutoBeEventSnapshot[]> => {
    const location: string = `${getDirectory(props)}/${props.phase}.snapshots.json.gz`;
    const content: string = await CompressUtil.gunzip(
      await fs.promises.readFile(location),
    );
    return JSON.parse(content);
  };

  export const getTokenUsage = async (props: {
    vendor: string;
    project: TestProject;
    phase: AutoBePhase;
  }): Promise<IAutoBeTokenUsageJson> => {
    const snapshots: AutoBeEventSnapshot[] = JSON.parse(
      await CompressUtil.gunzip(
        await fs.promises.readFile(
          `${getDirectory(props)}/${props.phase}.snapshots.json.gz`,
        ),
      ),
    );
    return snapshots.at(-1)?.tokenUsage ?? new AutoBeTokenUsage().toJSON();
  };

  export const has = async (props: {
    vendor: string;
    project: TestProject;
    phase: AutoBePhase;
  }): Promise<boolean> => {
    return fs.existsSync(
      `${getDirectory(props)}/${props.phase}.histories.json.gz`,
    );
  };

  export const slugModel = (model: string, replaceSlash: boolean): string => {
    model = model.replaceAll(":", "-");
    if (replaceSlash) model = model.replaceAll("/", "-");
    return model;
  };
}

const PROMPT_TEMPLATE = {
  prisma: "Design the database schema.",
  interface: "Create the API interface specification.",
  test: "Make the e2e test functions.",
  realize: "Implement API functions.",
};

const examples = new Singleton(() => {
  const location: string = `${TestGlobal.ROOT}/repositories/autobe-examples`;
  if (fs.existsSync(location) === false) {
    try {
      fs.mkdirSync(`${TestGlobal.ROOT}/repositories`);
    } catch {}
    cp.execSync(`git clone https://github.com/wrtnlabs/autobe-examples`, {
      cwd: `${TestGlobal.ROOT}/repositories`,
      stdio: "inherit",
    });
  }
  cp.execSync("git pull", {
    cwd: location,
    stdio: "ignore",
  });
  if (fs.existsSync(`${location}/raw`) === false)
    fs.mkdirSync(`${location}/raw`);
  return location;
});
