import { orchestratePrismaComponents } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaComponent";
import fs from "fs";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_prisma } from "./prepare_agent_prisma";

export const validate_agent_prisma_components = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  const { agent } = await prepare_agent_prisma(factory, project);
  const result = await orchestratePrismaComponents(agent.getContext());
  if (result.type !== "prismaComponents")
    throw new Error("Failed to orchestrate prisma components");

  if (process.argv.includes("--archive"))
    await fs.promises.writeFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.prisma.components.json`,
      JSON.stringify(result),
    );
};
