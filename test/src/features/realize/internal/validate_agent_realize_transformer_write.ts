import { orchestrateRealizeTransformerPlan } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeTransformerPlan";
import { orchestrateRealizeTransformerWrite } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeTransformerWrite";
import { AutoBeCompilerRealizeTemplate } from "@autobe/compiler/src/raw/AutoBeCompilerRealizeTemplate";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeExampleProject,
  AutoBeRealizeTransformerPlan,
  AutoBeRealizeWriteEvent,
} from "@autobe/interface";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { ArchiveLogger } from "../../../archive/utils/ArchiveLogger";
import { prepare_agent_realize } from "./prepare_agent_realize";

export const validate_agent_realize_transformer_write = async (props: {
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

  agent.on("assistantMessage", listen);
  for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, listen);

  const plans: AutoBeRealizeTransformerPlan[] =
    await orchestrateRealizeTransformerPlan(agent.getContext(), {
      progress: {
        total: 0,
        completed: 0,
      },
    });
  const writes: AutoBeRealizeWriteEvent[] =
    await orchestrateRealizeTransformerWrite(agent.getContext(), {
      plans,
      progress: {
        total: 0,
        completed: 0,
      },
    });
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/realize-transformer`,
    files: {
      ...(await agent.getFiles()),
      ...AutoBeCompilerRealizeTemplate,
      ...Object.fromEntries(
        writes
          .filter((w) => w !== null)
          .map((w) => [w.function.location, w.function.content]),
      ),
      "pnpm-workspace.yaml": "",
    },
  });
};
