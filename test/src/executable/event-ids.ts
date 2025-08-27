import { CompressUtil } from "@autobe/filesystem";
import { AutoBeEventSnapshot } from "@autobe/interface";
import fs from "fs";
import { v7 } from "uuid";

import { TestGlobal } from "../TestGlobal";

const iterate = async (location: string): Promise<void> => {
  for (const file of await fs.promises.readdir(location)) {
    const next: string = `${location}/${file}`;
    const stat: fs.Stats = await fs.promises.stat(next);
    if (stat.isDirectory()) await iterate(next);
    else if (file.endsWith(".snapshots.json.gz")) {
      const data: AutoBeEventSnapshot[] = JSON.parse(
        await CompressUtil.gunzip(await fs.promises.readFile(next)),
      );
      for (const s of data) s.event.id ??= v7();
      await fs.promises.writeFile(
        next,
        await CompressUtil.gzip(JSON.stringify(data)),
      );
    }
  }
};
iterate(`${TestGlobal.ROOT}/assets/histories`).catch(console.error);
