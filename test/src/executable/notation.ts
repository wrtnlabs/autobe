import { AutoBePrisma } from "@autobe/interface";
import fs from "fs";
import typia from "typia";
import { NamingConvention } from "typia/lib/utils/NamingConvention";

import { TestGlobal } from "../TestGlobal";

const DIRECTORY = `${TestGlobal.ROOT}/src/features/compiler/examples`;

const main = async (): Promise<void> => {
  for (const filePath of await fs.promises.readdir(DIRECTORY)) {
    if (filePath.startsWith("prisma.") === false) continue;
    const location: string = `${DIRECTORY}/${filePath}`;
    const content: string = await fs.promises.readFile(location, "utf-8");
    const app: AutoBePrisma.IApplication = JSON.parse(content);
    for (const file of app.files)
      for (const model of file.models)
        for (const fk of model.foreignFields)
          fk.relation.name = NamingConvention.camel(fk.relation.name);
    typia.assert(app);
    await fs.promises.writeFile(location, JSON.stringify(app), "utf8");
  }
};
main().catch(console.error);
