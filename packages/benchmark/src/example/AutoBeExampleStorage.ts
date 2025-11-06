import { CompressUtil } from "@autobe/filesystem";
import {
  AutoBeEventSnapshot,
  AutoBeExampleProject,
  AutoBeHistory,
  AutoBePhase,
  AutoBeUserMessageHistory,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import cp from "child_process";
import fs from "fs";
import path from "path";
import { Singleton, VariadicSingleton } from "tstl";
import { v7 } from "uuid";

export namespace AutoBeExampleStorage {
  export const repository = (): string => examples.get();
  export const getDirectory = (props: {
    vendor: string;
    project: string;
  }): string =>
    `${examples.get()}/raw/${slugModel(props.vendor, false)}/${props.project}`;

  export const save = async (props: {
    vendor: string;
    project: AutoBeExampleProject;
    files: Record<string, string>;
  }): Promise<void> => {
    await saveWithGzip({
      root: `${getDirectory(props)}`,
      files: props.files,
      overwrite: true,
    });
  };

  export const getUserMessage = async (props: {
    project: AutoBeExampleProject;
    phase: AutoBePhase;
  }): Promise<AutoBeUserMessageHistory> => {
    const full: string = `${TEST_ROOT}/scripts/${props.project}/${props.phase}`;
    if (fs.existsSync(`${full}.md`) === false) {
      const text: string =
        props.phase === "analyze"
          ? await fs.promises.readFile(
              `${TEST_ROOT}/scripts/${props.project}.md`,
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
    const rawPath: string = `${repository()}/raw`;
    for (const vendor of await fs.promises.readdir(rawPath)) {
      if (
        (await fs.promises
          .lstat(`${rawPath}/${vendor}`)
          .then((stat) => stat.isDirectory())) === false
      )
        continue;
      for (const model of await fs.promises.readdir(`${rawPath}/${vendor}`)) {
        const stat: fs.Stats = await fs.promises.lstat(
          `${rawPath}/${vendor}/${model}`,
        );
        if (stat.isDirectory() === true) result.push(`${vendor}/${model}`);
      }
    }
    return result.sort();
  };

  export const getHistories = async (props: {
    vendor: string;
    project: AutoBeExampleProject;
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
    project: AutoBeExampleProject;
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
    project: AutoBeExampleProject;
    phase: AutoBePhase;
  }): Promise<IAutoBeTokenUsageJson> => {
    const snapshots: AutoBeEventSnapshot[] = await getSnapshots(props);
    return (
      snapshots.at(-1)?.tokenUsage ??
      (() => {
        const component = (): IAutoBeTokenUsageJson.IComponent => ({
          total: 0,
          input: {
            total: 0,
            cached: 0,
          },
          output: {
            total: 0,
            reasoning: 0,
            accepted_prediction: 0,
            rejected_prediction: 0,
          },
        });
        return {
          aggregate: component(),
          facade: component(),
          analyze: component(),
          prisma: component(),
          interface: component(),
          test: component(),
          realize: component(),
        };
      })()
    );
  };

  export const has = async (props: {
    vendor: string;
    project: AutoBeExampleProject;
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
const TEST_ROOT: string = `${__dirname}/../../../../test`;

const examples = new Singleton(() => {
  const location: string = `${TEST_ROOT}/repositories/autobe-examples`;
  if (fs.existsSync(location) === false) {
    try {
      fs.mkdirSync(`${TEST_ROOT}/repositories`);
    } catch {}
    cp.execSync(`git clone https://github.com/wrtnlabs/autobe-examples`, {
      cwd: `${TEST_ROOT}/repositories`,
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

const saveWithGzip = async (props: {
  root: string;
  files: Record<string, string>;
  overwrite?: boolean;
}): Promise<void> => {
  if (props.overwrite !== true && fs.existsSync(props.root))
    await fs.promises.rm(props.root, {
      recursive: true,
    });
  const directory = new VariadicSingleton(async (location: string) => {
    try {
      await fs.promises.mkdir(location, {
        recursive: true,
      });
    } catch {}
  });
  for (const [key, value] of Object.entries(props.files)) {
    const file: string = path.resolve(`${props.root}/${key}.gz`);
    await directory.get(path.dirname(file));
    await fs.promises.writeFile(file, await CompressUtil.gzip(value ?? ""));
  }
};
