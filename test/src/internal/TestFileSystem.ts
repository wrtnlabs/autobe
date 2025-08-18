import { CompressUtil } from "@autobe/filesystem";
import fs from "fs";
import path from "path";
import { VariadicSingleton } from "tstl";

export namespace TestFileSystem {
  export const read = async (props: {
    root: string;
    extension?: string;
    prefix?: string;
  }): Promise<Record<string, string>> => {
    const output: Record<string, string> = {};
    const iterate = async (location: string) => {
      const directory: string[] = await fs.promises.readdir(location);
      for (const file of directory) {
        const next: string = `${location}/${file}`;
        const stat: fs.Stats = await fs.promises.stat(next);
        if (stat.isDirectory()) await iterate(next);
        else if (
          (!props.extension?.length && file.endsWith(".gz")) ||
          file.endsWith(`.${props.extension}.gz`)
        )
          output[
            `${props.prefix ?? ""}${next.substring(
              props.root.length + 1,
              next.length - 3,
            )}`
          ] = await CompressUtil.gunzip(await fs.promises.readFile(next));
      }
    };
    await iterate(props.root);
    return output;
  };

  export const save = async (props: {
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
}
