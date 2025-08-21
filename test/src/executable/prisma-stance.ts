import { AutoBePrisma } from "@autobe/interface";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";

const DIRECTORY = `${TestGlobal.ROOT}/src/features/compiler/examples`;

const main = async (): Promise<void> => {
  for (const file of await fs.promises.readdir(DIRECTORY)) {
    if (file.endsWith(".prisma.json") === false) continue;
    const location: string = `${DIRECTORY}/${file}`;
    const application: AutoBePrisma.IApplication = JSON.parse(
      await fs.promises.readFile(location, "utf-8"),
    );
    for (const model of application.files.map((f) => f.models).flat())
      model.stance = "primary";
    await fs.promises.writeFile(location, JSON.stringify(application), "utf8");
  }
};
main().catch(console.error);
