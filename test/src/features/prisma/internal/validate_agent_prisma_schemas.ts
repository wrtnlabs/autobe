import { orchestratePrismaSchemas } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaSchemas";
import {
  AutoBePrismaComponentsEvent,
  AutoBePrismaSchemasEvent,
} from "@autobe/interface";
import fs from "fs";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_prisma } from "./prepare_agent_prisma";

export const validate_agent_prisma_schemas = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  const { agent } = await prepare_agent_prisma(factory, project);
  const ce: AutoBePrismaComponentsEvent = JSON.parse(
    await fs.promises.readFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.prisma.components.json`,
      "utf8",
    ),
  );

  const time: Date = new Date();
  const elapsed = () =>
    (new Date().getTime() - time.getTime()).toLocaleString() + " ms";
  agent.on("prismaSchemas", (event) => {
    console.log(
      `  - prisma schemas (${event.file.filename}, ${event.completed} of ${event.total}):`,
      elapsed(),
    );
  });
  agent.on("prismaInsufficient", (event) => {
    console.log(
      `  - prisma insufficient: (${event.component.filename}, ${event.missed.length} of ${event.component.tables.length})`,
      elapsed(),
    );
    console.log("    - expected:", event.component.tables.join(", "));
    console.log("    - actual:", event.actual.map((m) => m.name).join(", "));
    console.log(`    - tablesToCreate:`, event.tablesToCreate.join(", "));
    console.log(`    - validationReview:`, event.validationReview);
    console.log(`    - confirmedTables:`, event.confirmedTables.join(", "));
  });

  const result: AutoBePrismaSchemasEvent[] = await orchestratePrismaSchemas(
    agent.getContext(),
    ce.components,
  );
  if (process.argv.includes("--archive"))
    await fs.promises.writeFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.prisma.schemas.json`,
      JSON.stringify(result, null, 2),
    );

  const expected: string[] = ce.components
    .map((c) => c.tables)
    .flat()
    .sort();
  const actual: string[] = Array.from(
    new Set(result.map((e) => e.file.models.map((m) => m.name)).flat()),
  ).sort();
  console.log(
    expected,
    actual,
    expected.length === actual.length &&
      expected.every((v, i) => v === actual[i]),
  );
};
