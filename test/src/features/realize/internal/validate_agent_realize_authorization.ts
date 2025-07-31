import { orchestrateRealizeAuthorization } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeAuthorization";
import { InternalFileSystem } from "@autobe/agent/src/orchestrate/realize/utils/InternalFileSystem";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEvent,
  AutoBeHistory,
  AutoBeRealizeAuthorization,
  IAutoBeCompiler,
} from "@autobe/interface";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_realize } from "./prepare_agent_realize";

export const validate_agent_realize_authorization = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.API_KEY === undefined) return false;

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
  agent.on("realizeProgress", enroll);
  agent.on("realizeValidate", enroll);
  agent.on("realizeComplete", enroll);
  agent.on("realizeAuthorizationStart", enroll);
  agent.on("realizeAuthorizationWrite", enroll);
  agent.on("realizeAuthorizationValidate", enroll);
  agent.on("realizeAuthorizationCorrect", enroll);
  agent.on("realizeAuthorizationComplete", enroll);

  const ctx = agent.getContext();

  const authorizations: AutoBeRealizeAuthorization[] =
    await orchestrateRealizeAuthorization(ctx);

  const prisma = ctx.state().prisma?.compiled;
  const prismaClients: Record<string, string> =
    prisma?.type === "success" ? prisma.nodeModules : {};

  const templateFiles = await (await ctx.compiler()).realize.getTemplate();
  const files: Record<string, string> = {
    ...InternalFileSystem.DEFAULT.map((key) => ({
      [key]: templateFiles[key],
    })).reduce((acc, cur) => Object.assign(acc, cur), {}),
    ...prismaClients,
    ...authorizations.reduce(
      (acc, curr) => {
        acc[curr.decorator.location] = curr.decorator.content;
        acc[curr.payload.location] = curr.payload.content;
        acc[curr.provider.location] = curr.provider.content;
        return acc;
      },
      {} as Record<string, string>,
    ),
  };

  const histories: AutoBeHistory[] = agent.getHistories();
  const model: string = TestGlobal.getVendorModel();
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${model}/${project}/realize/authorization`,
    files: {
      ...(await agent.getFiles()),
      ...files,
      "logs/events.json": JSON.stringify(events),
      "logs/result.json": JSON.stringify(authorizations),
      "logs/histories.json": JSON.stringify(histories),
    },
  });

  const compiler: IAutoBeCompiler = await ctx.compiler();
  const compiled = await compiler.typescript.compile({ files });

  if (compiled.type !== "success") {
    throw new Error(JSON.stringify(compiled));
  }
};
