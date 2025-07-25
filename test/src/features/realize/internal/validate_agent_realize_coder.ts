import { orchestrateRealizeAuthorization } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeAuthorization";
import { writeCodeUntilCompilePassed } from "@autobe/agent/src/orchestrate/realize/writeCodeUntilCompilePassed";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeEvent, AutoBeRealizeFunction } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import { readFile } from "fs/promises";
import path from "path";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_realize_coder } from "./prepare_agent_realize_coder";

export const validate_agent_realize_coder = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent } = await prepare_agent_realize_coder(factory, project);

  const map = new Map<string, true>();
  const events: AutoBeEvent[] = [];
  const enroll = (event: AutoBeEvent) => {
    if (!map.has(event.type)) {
      map.set(event.type, true);
    }

    if (event.type === "realizeProgress") {
      console.log(
        event.filename,
        `${event.completed}/${event.total} completed.`,
      );
    }

    events.push(event);
  };

  agent.on("realizeStart", enroll);
  agent.on("realizeProgress", enroll);
  agent.on("realizeValidate", enroll);
  agent.on("realizeComplete", enroll);

  const ctx = agent.getContext();

  const ops = ctx.state().interface?.document.operations ?? [];

  const authorizations = await orchestrateRealizeAuthorization(ctx);

  // DO TEST GENERATION
  const go = async () =>
    await writeCodeUntilCompilePassed(ctx, ops, authorizations, 2);

  const result: AutoBeRealizeFunction[] = await go();

  const codes = result.reduce<Record<string, string>>((acc, cur) => {
    return Object.assign(acc, {
      [cur.location]: cur.content,
    });
  }, {});

  const histories = agent.getHistories();
  const prisma = agent.getContext().state().prisma?.compiled;
  const nodeModules = prisma?.type === "success" ? prisma.nodeModules : {};

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${project}/realize/main`,
    files: {
      ...(await agent.getFiles()),
      ...codes,
      ...nodeModules,
      "logs/events.json": JSON.stringify(events),
      "logs/result.json": JSON.stringify(result),
      "logs/histories.json": JSON.stringify(histories),
    },
  });

  const compiler = await ctx.compiler();
  const res = await compiler.typescript.compile({
    files: {
      ...Object.entries(await agent.getFiles())
        .filter(([key]) => {
          return key.startsWith("src");
        })
        .reduce(
          (acc, [filename, content]) =>
            Object.assign(acc, { [filename]: content }),
          {},
        ),
      ...codes,
      ...nodeModules,
      "src/MyGlobal.ts": await readFile(
        path.join(
          __dirname,
          "../../../../../internals/template/realize/src/MyGlobal.ts",
        ),
        {
          encoding: "utf-8",
        },
      ),
    },
  });

  console.log(
    JSON.stringify(res.type === "failure" ? res.diagnostics : []),
    "diagnostics",
  );
  TestValidator.equals("compile success")(res.type)("success");

  // TODO: Need to check for missing Providers
};
