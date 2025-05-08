import { IAutoBePrismaResult } from "@autobe/interface";
import { AutoBePrisma } from "@autobe/prisma";
import { TestValidator } from "@nestia/e2e";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";

export const test_prisma_correct = async (): Promise<void> => {
  const result: IAutoBePrismaResult = await new AutoBePrisma().build({
    schemas: {
      "schema.prisma": await fs.promises.readFile(
        `${TestGlobal.ROOT}/assets/schema.prisma`,
        "utf8",
      ),
    },
  });
  console.log(result);
  TestValidator.equals("result")(result.type)("success");
};
