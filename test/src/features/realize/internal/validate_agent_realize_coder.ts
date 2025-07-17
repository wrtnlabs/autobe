import {
  FAILED,
  pipe,
} from "@autobe/agent/src/orchestrate/realize/orchestrateRealize";
import { orchestrateRealizeCoder } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeCoder";
import { orchestrateRealizePlanner } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizePlanner";
import { IAutoBeRealizeCoderApplication } from "@autobe/agent/src/orchestrate/realize/structures/IAutoBeRealizeCoderApplication";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeEvent } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import { readFile } from "fs/promises";
import path from "path";
import typia from "typia";

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

    events.push(event);
  };

  agent.on("realizeStart", enroll);
  agent.on("realizeProgress", enroll);
  agent.on("realizeValidate", enroll);
  agent.on("realizeComplete", enroll);

  const ctx = agent.getContext();

  const ops = ctx.state().interface?.document.operations ?? [];

  const files = await agent.getFiles();

  // DO TEST GENERATION
  const go = async () =>
    await Promise.all(
      ops.map(async (op) =>
        pipe(
          op,
          (op) => orchestrateRealizePlanner(ctx, op),
          (c) => orchestrateRealizeCoder(ctx, op, c, files),
        ),
      ),
    );

  const result: (IAutoBeRealizeCoderApplication.RealizeCoderOutput | FAILED)[] =
    await go();

  const providers = result
    .filter((el) => el !== FAILED)
    .reduce<Record<string, string>>((acc, cur) => {
      return Object.assign(acc, {
        [`src/providers/${cur.functionName}.ts`]: cur.implementationCode,
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
      ...providers,
      ...nodeModules,
      "src/providers/jwtDecode.ts": await readFile(
        path.join(
          __dirname,
          "../../../../../internals/template/src/providers/jwtDecode.ts",
        ),
        {
          encoding: "utf-8",
        },
      ),
      "src/MyGlobal.ts": await readFile(
        path.join(
          __dirname,
          "../../../../../internals/template/src/MyGlobal.ts",
        ),
        {
          encoding: "utf-8",
        },
      ),
      "logs/events.json": typia.json.stringify(events),
      "logs/result.json": typia.json.stringify(result),
      "logs/histories.json": typia.json.stringify(histories),
    },
  });
  TestValidator.predicate("result")(result.every((el) => el !== FAILED));

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
      ...providers,
      ...nodeModules,
      "src/providers/jwtDecode.ts": await readFile(
        path.join(
          __dirname,
          "../../../../../internals/template/src/providers/jwtDecode.ts",
        ),
        {
          encoding: "utf-8",
        },
      ),
      "src/MyGlobal.ts": await readFile(
        path.join(
          __dirname,
          "../../../../../internals/template/src/MyGlobal.ts",
        ),
        {
          encoding: "utf-8",
        },
      ),
    },
  });

  TestValidator.equals("compile success")(res.type)("success");
};
