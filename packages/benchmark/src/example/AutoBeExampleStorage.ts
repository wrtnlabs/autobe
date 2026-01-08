import { CompressUtil } from "@autobe/filesystem";
import {
  AutoBeEventSnapshot,
  AutoBeExampleProject,
  AutoBeHistory,
  AutoBePhase,
  AutoBeUserConversateContent,
  AutoBeUserImageConversateContent,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import cp from "child_process";
import fs from "fs";
import path from "path";
import { Singleton, VariadicSingleton } from "tstl";

export namespace AutoBeExampleStorage {
  export const TEST_ROOT: string = `${__dirname}/../../../../test`;

  export const repository = (): string => examples.get();
  export const getDirectory = (props: {
    vendor: string;
    project: string;
  }): string =>
    `${examples.get()}/raw/${slugModel(props.vendor, false)}/${props.project}`;

  export const save = async (props: {
    vendor: string;
    project: AutoBeExampleProject;
    files: Record<string, string | null>;
  }): Promise<void> => {
    await saveWithGzip({
      root: `${getDirectory(props)}`,
      files: props.files,
      overwrite: true,
    });
  };

  export const load = async <T>(props: {
    vendor: string;
    project: AutoBeExampleProject;
    file: string;
  }): Promise<T | null> => {
    const location: string = `${getDirectory(props)}/${props.file}.gz`;
    if (fs.existsSync(location) === false) return null;
    const content: string = await CompressUtil.gunzip(
      await fs.promises.readFile(location),
    );
    return JSON.parse(content) as T;
  };

  export const loadImages = async (
    imagePath: string,
  ): Promise<AutoBeUserConversateContent[]> => {
    const stat: fs.Stats = await fs.promises.lstat(imagePath);

    const filePaths: string[] = await (async () => {
      if (stat.isFile() === true) {
        if (imagePath.endsWith(".png") === false)
          throw new Error("Image Format must be .png");
        return [imagePath];
      }
      const files: string[] = await fs.promises.readdir(imagePath);
      return files
        .filter((f) => f.endsWith(".png"))
        .map((f) => path.join(imagePath, f));
    })();

    return Promise.all(
      filePaths.map(async (filePath) => {
        const extension: string = path.extname(filePath).toLowerCase().slice(1);
        const base64Data: string = `data:image/${extension};base64,${await fs.promises.readFile(filePath, "base64")}`;
        return {
          type: "image",
          image: {
            type: "base64",
            data: base64Data,
          } satisfies AutoBeUserImageConversateContent.IBase64,
        } satisfies AutoBeUserConversateContent;
      }),
    );
  };

  export const getUserMessage = async (props: {
    project: AutoBeExampleProject;
    phase: AutoBePhase;
    imagePath?: string;
  }): Promise<AutoBeUserConversateContent[]> => {
    const imageMessages: AutoBeUserConversateContent[] = props.imagePath
      ? await loadImages(props.imagePath)
      : [];

    const full: string = `${TEST_ROOT}/scripts/${props.project}/${props.phase}`;
    if (props.project === "account" && props.phase === "analyze") {
      const files: string[] = await fs.promises.readdir(full);
      const contents: AutoBeUserConversateContent[] = await Promise.all(
        files.map(async (filename) => {
          const filePath = path.join(full, filename);
          const extension = filename.split(".").pop() ?? "unknown";
          const base64Data = `data:image/${extension};base64,${await fs.promises.readFile(filePath, "base64")}`;

          return {
            type: "image",
            image: {
              type: "base64",
              data: base64Data,
            },
          } satisfies AutoBeUserConversateContent;
        }),
      );
      return [
        ...contents,
        ...imageMessages,
        {
          type: "text",
          text: "Convert the images into a planning document.",
        },
      ];
    }

    if (fs.existsSync(`${full}.md`) === false) {
      const text: string =
        props.phase === "analyze"
          ? await fs.promises.readFile(
              `${TEST_ROOT}/scripts/${props.project}.md`,
              "utf8",
            )
          : PROMPT_TEMPLATE[props.phase];
      return [
        ...imageMessages,
        {
          type: "text",
          text,
        },
      ];
    }

    const text: string = await fs.promises.readFile(`${full}.md`, "utf8");

    return [
      ...imageMessages,
      {
        type: "text",
        text,
      },
    ];
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
          database: component(),
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

  const PROMPT_TEMPLATE = {
    database: "Design the database schema.",
    interface: "Create the API interface specification.",
    test: "Make the e2e test functions.",
    realize: "Implement API functions.",
  };

  const examples = new Singleton(() => {
    const location: string = `${TEST_ROOT}/../../autobe-examples`;
    if (fs.existsSync(location) === false)
      cp.execSync(`git clone https://github.com/wrtnlabs/autobe-examples`, {
        cwd: `${TEST_ROOT}/../../`,
        stdio: "inherit",
      });
    if (fs.existsSync(`${location}/raw`) === false)
      fs.mkdirSync(`${location}/raw`);
    return location;
  });

  const saveWithGzip = async (props: {
    root: string;
    files: Record<string, string | null>;
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
      if (value !== null)
        await fs.promises.writeFile(file, await CompressUtil.gzip(value ?? ""));
      else
        try {
          await fs.promises.unlink(file);
        } catch {}
    }
  };
}
