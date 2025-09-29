import { CompressUtil } from "@autobe/filesystem";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";

const main = async (): Promise<void> => {
  const groups = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${TestGlobal.ROOT}/assets/histories/openai/gpt-4.1/shopping.interface.groups.json.gz`,
      ),
    ),
  );
  console.log(groups);
};
main().catch(console.error);
