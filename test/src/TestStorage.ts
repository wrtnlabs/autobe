import { CompressUtil } from "@autobe/filesystem";
import { AutoBeExampleProject } from "@autobe/interface";
import fs from "fs";
import path from "path";

import { TestGlobal } from "./TestGlobal";

export namespace TestStorage {
  export const emplace = async <T>(
    props: {
      vendor: string;
      project: AutoBeExampleProject;
      file: string;
    },
    closure: () => Promise<T>,
  ): Promise<T> => {
    const location: string = `${TestGlobal.ROOT}/results/storage/${props.vendor}/${props.project}/${props.file}.json.gz`;
    if (fs.existsSync(location))
      return JSON.parse(
        await CompressUtil.gunzip(await fs.promises.readFile(location)),
      );
    const data: T = await closure();
    try {
      await fs.promises.mkdir(path.dirname(location), { recursive: true });
    } catch {}
    await fs.promises.writeFile(
      location,
      await CompressUtil.gzip(JSON.stringify(data)),
    );
    return data;
  };
}
