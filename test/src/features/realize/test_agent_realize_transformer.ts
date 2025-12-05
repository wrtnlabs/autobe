import { orchestrateRealizeTransformer } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeTransformer";
import { AutoBeCompilerRealizeTemplate } from "@autobe/compiler/src/raw/AutoBeCompilerRealizeTemplate";
import { AutoBeCompilerRealizeTemplateOfSQLite } from "@autobe/compiler/src/raw/AutoBeCompilerRealizeTemplateOfSQLite";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeExampleProject,
  AutoBeProgressEventBase,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";
import cp from "child_process";
import typia from "typia";

import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { ArchiveLogger } from "../../archive/utils/ArchiveLogger";
import { prepare_agent_realize } from "./internal/prepare_agent_realize";

export const test_agent_realize_transformer_todo = (factory: TestFactory) =>
  validate_agent_realize_transformer({
    factory,
    vendor: TestGlobal.vendorModel,
    project: "todo",
  });

export const test_agent_realize_transformer_bbs = (factory: TestFactory) =>
  validate_agent_realize_transformer({
    factory,
    vendor: TestGlobal.vendorModel,
    project: "bbs",
  });

export const test_agent_realize_transformer_reddit = (factory: TestFactory) =>
  validate_agent_realize_transformer({
    factory,
    vendor: TestGlobal.vendorModel,
    project: "reddit",
  });

export const test_agent_realize_transformer_shopping = (factory: TestFactory) =>
  validate_agent_realize_transformer({
    factory,
    vendor: TestGlobal.vendorModel,
    project: "shopping",
  });

const validate_agent_realize_transformer = async (props: {
  factory: TestFactory;
  vendor: string;
  project: AutoBeExampleProject;
}) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent } = await prepare_agent_realize(props);
  const start: Date = new Date();
  const snapshots: AutoBeEventSnapshot[] = [];
  const listen = (event: AutoBeEventOfSerializable) => {
    if (TestGlobal.archive) ArchiveLogger.event(start, event);
    snapshots.push({
      event,
      tokenUsage: agent.getTokenUsage().toJSON(),
    });
  };
  for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, listen);

  const progress = (): AutoBeProgressEventBase => ({
    total: 0,
    completed: 0,
  });
  const transformers: AutoBeRealizeTransformerFunction[] =
    await orchestrateRealizeTransformer(agent.getContext(), {
      planProgress: progress(),
      writeProgress: progress(),
      correctProgress: progress(),
    });
  const cwd: string = `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/realize-transformer`;
  await FileSystemIterator.save({
    root: cwd,
    files: {
      ...(await agent.getFiles()),
      ...AutoBeCompilerRealizeTemplate,
      ...AutoBeCompilerRealizeTemplateOfSQLite,
      ...Object.fromEntries(
        transformers
          .filter((w) => w !== null)
          .map((c) => [c.location, c.content]),
      ),
      "pnpm-workspace.yaml": "",
    },
  });
  console.log(`code ${cwd.replaceAll("\\", "/")}`);
  cp.execSync("pnpm install", { cwd, stdio: "ignore" });
  cp.execSync("pnpm tsc", { cwd, stdio: "inherit" });
};
