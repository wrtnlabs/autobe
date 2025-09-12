import fs from "fs";

import { TestGlobal } from "../TestGlobal";

const main = async (): Promise<void> => {
  const directory = await fs.promises.readdir(TestGlobal.ROOT);
  for (const file of directory) {
    if (file.endsWith(".log") === false) continue;
    const content: string = await fs.promises.readFile(
      `${TestGlobal.ROOT}/${file}`,
      "utf-8",
    );
    const times: number[] = content
      .split("(max: ")
      .slice(1)
      .map((s) => s.split(")")[0])
      .map((s) => Number(s));
    console.log(file, Math.max(...times));
  }
};
main().catch((err) => {
  console.log(err);
  process.exit(-1);
});
