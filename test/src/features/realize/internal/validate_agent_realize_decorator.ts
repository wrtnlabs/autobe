import { orchestrateRealizeDecorator } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeDecorator";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeEvent, IAutoBeCompiler } from "@autobe/interface";
import fs from "fs";
import path from "path";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_realize } from "./prepare_agent_realize";

export const validate_agent_realize_decorator = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent } = await prepare_agent_realize(factory, project);

  const map = new Map<string, true>();
  const events: AutoBeEvent[] = [];
  const enroll = (event: AutoBeEvent) => {
    if (!map.has(event.type)) {
      map.set(event.type, true);
    }

    events.push(event);
  };

  agent.on("realizeStart", enroll);
  agent.on("realizeDecorator", enroll);
  agent.on("realizeDecoratorValidate", enroll);
  agent.on("realizeDecoratorCorrect", enroll);
  agent.on("realizeProgress", enroll);
  agent.on("realizeValidate", enroll);
  agent.on("realizeComplete", enroll);

  const ctx = agent.getContext();

  const result = await orchestrateRealizeDecorator(ctx);

  const prisma = ctx.state().prisma?.compiled;

  const prismaClients: Record<string, string> =
    prisma?.type === "success" ? prisma.nodeModules : {};

  const files: Record<string, string> = {
    "src/MyGlobal.ts": await fs.promises.readFile(
      path.join(
        __dirname,
        "../../../../../internals/template/realize/src/MyGlobal.ts",
      ),
      "utf-8",
    ),
    "src/authentications/jwtAuthorize.ts": await fs.promises.readFile(
      path.join(
        __dirname,
        "../../../../../internals/template/realize/src/providers/jwtAuthorize.ts",
      ),
      "utf-8",
    ),
    ...prismaClients,
    ...result.reduce(
      (acc, curr) => {
        acc[`src/decorators/${curr.decorator.name}.ts`] = curr.decorator.code;
        acc[`src/authentications/${curr.provider.name}.ts`] =
          curr.provider.code;
        acc[`src/authentications/types/${curr.payload.name}.ts`] =
          curr.payload.code;
        return acc;
      },
      {} as Record<string, string>,
    ),
  };

  const histories = agent.getHistories();

  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${project}/realize/decorator`,
    files: {
      ...(await agent.getFiles()),
      ...files,
      "logs/events.json": JSON.stringify(events),
      "logs/result.json": JSON.stringify(result),
      "logs/histories.json": JSON.stringify(histories),
    },
  });

  const compiler: IAutoBeCompiler = await ctx.compiler();
  const compiled = await compiler.typescript.compile({ files });

  if (compiled.type !== "success") {
    throw new Error(JSON.stringify(compiled));
  }
};
