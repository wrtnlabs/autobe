import { CompressUtil } from "@autobe/filesystem";
import { AutoBeEventSnapshot } from "@autobe/interface";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";

const unique: Set<string> = new Set();

const fixEventTypeName = (event: { type: string }): void => {
  const before: string = event.type;
  let after: string = before
    .split(/(?=[A-Z])/)
    .map((word) => {
      if (word.length > 1 && word.endsWith("s")) return word.slice(0, -1);
      return word;
    })
    .join("");
  if (after === "interfaceSchemaReview") after = "interfaceSchemaContentReview";
  event.type = after;

  if (before !== after && unique.has(before) === false) {
    unique.add(before);
    console.log(`${before} => ${after}`);
  }
};

const fix = async (location: string): Promise<void> => {
  const snapshots: AutoBeEventSnapshot[] = JSON.parse(
    await CompressUtil.gunzip(await fs.promises.readFile(location)),
  );
  for (const { event } of snapshots) fixEventTypeName(event);
  await fs.promises.writeFile(
    location,
    await CompressUtil.gzip(JSON.stringify(snapshots)),
  );
};

const iterate = async (location: string): Promise<void> => {
  const directory: string[] = await fs.promises.readdir(location);
  for (const file of directory) {
    const next: string = `${location}/${file}`;
    const stat: fs.Stats = await fs.promises.stat(next);
    if (stat.isDirectory()) await iterate(next);
    else if (file.endsWith(".snapshots.json.gz")) await fix(next);
  }
};
const main = async (): Promise<void> => {
  await iterate(TestGlobal.ROOT + "/assets/histories");
};
main().catch(console.error);
