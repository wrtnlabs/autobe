import { AutoBeExampleStorage } from "@autobe/benchmark";
import { CompressUtil } from "@autobe/filesystem";
import { IAutoBePlaygroundReplay } from "@autobe/interface";
import fs from "fs";

const fix = async (location: string): Promise<void> => {
  const summary: IAutoBePlaygroundReplay.ISummary = JSON.parse(
    await CompressUtil.gunzip(await fs.promises.readFile(location)),
  );
  summary.vendor = summary.vendor.replace(":exacto", "");
  summary.vendor = summary.vendor.replace("-exacto", "");
  await fs.promises.writeFile(
    location,
    await CompressUtil.gzip(JSON.stringify(summary)),
  );
};

const iterate = async (location: string): Promise<void> => {
  const directory: string[] = await fs.promises.readdir(location);
  for (const file of directory) {
    const next: string = `${location}/${file}`;
    const stat: fs.Stats = await fs.promises.lstat(next);
    if (stat.isDirectory() === true) await iterate(next);
    else if (file === "summary.json.gz") await fix(next);
  }
};

const main = async (): Promise<void> => {
  await iterate(`${AutoBeExampleStorage.repository()}/raw`);
};
main().catch(console.error);
