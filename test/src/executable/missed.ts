import { CompressUtil } from "@autobe/filesystem";
import { AutoBeEventSnapshot, AutoBeHistory } from "@autobe/interface";
import { missedOpenApiSchemas } from "@autobe/utils";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";

const histories = (data: AutoBeHistory[]): void => {
  for (const history of data)
    if (history.type === "interface")
      history.missed ??= missedOpenApiSchemas(history.document);
};
const snapshots = (data: AutoBeEventSnapshot[]): void => {
  for (const { event } of data)
    if (event.type === "interfaceComplete")
      event.missed ??= missedOpenApiSchemas(event.document);
};

const iterate = async (location: string): Promise<void> => {
  const directory: string[] = await fs.promises.readdir(location);
  for (const file of directory) {
    const next: string = `${location}/${file}`;
    const stat: fs.Stats = await fs.promises.stat(next);
    if (stat.isDirectory() === true) await iterate(next);
    else if (file.endsWith(".json.gz")) {
      const data: any = JSON.parse(
        await CompressUtil.gunzip(await fs.promises.readFile(next)),
      );
      if (file.endsWith("snapshots.json.gz")) snapshots(data);
      else histories(data);
      await fs.promises.writeFile(
        next,
        await CompressUtil.gzip(JSON.stringify(data)),
      );
    }
  }
};

const main = async (): Promise<void> => {
  await iterate(`${TestGlobal.ROOT}/assets/histories`);
};
main().catch(console.error);
