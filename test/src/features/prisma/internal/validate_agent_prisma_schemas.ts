import { orchestratePrismaSchemas } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaSchemas";
import {
  AutoBePrismaComponentsEvent,
  AutoBePrismaSchemasEvent,
} from "@autobe/interface";
import fs from "fs";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_prisma } from "./prepare_agent_prisma";

export const validate_agent_prisma_schemas = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.API_KEY === undefined) return false;

  const { agent } = await prepare_agent_prisma(factory, project);
  const model: string = TestGlobal.getVendorModel();
  const components: AutoBePrismaComponentsEvent = JSON.parse(
    await fs.promises.readFile(
      `${TestGlobal.ROOT}/assets/histories/${model}/${project}.prisma.components.json`,
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
  });

  const result: AutoBePrismaSchemasEvent[] = await orchestratePrismaSchemas(
    agent.getContext(),
    components.components,
  );
  if (process.argv.includes("--archive"))
    await TestHistory.save({
      [`${project}.prisma.schemas.json`]: JSON.stringify(result),
    });

  const expected: string[] = components.components
    .map((c) => c.tables)
    .flat()
    .sort();
  const actual: string[] = Array.from(
    new Set(result.map((e) => e.file.models.map((m) => m.name)).flat()),
  ).sort();
  console.log({
    expected: expected.length,
    actual: actual.length,
    matched:
      expected.length === actual.length &&
      expected.every((v, i) => v === actual[i]),
  });
};
