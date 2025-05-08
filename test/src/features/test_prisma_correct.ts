import { AutoBePrisma, IAutoBePrismaResult } from "@autobe/prisma";
import { TestValidator } from "@nestia/e2e";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";

export const test_prisma_correct = async (): Promise<void> => {
  const content: string = await fs.promises.readFile(
    `${TestGlobal.ROOT}/assets/schema.prisma`,
    "utf8",
  );
  const result: IAutoBePrismaResult = await new AutoBePrisma().compile(content);
  TestValidator.equals("result")(result.type)("success");
};
