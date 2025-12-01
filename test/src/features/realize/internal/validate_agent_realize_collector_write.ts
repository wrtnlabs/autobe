import { orchestrateRealizeCollectorPlan } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeCollectorPlan";
import { orchestrateRealizeCollectorWrite } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeCollectorWrite";
import { AutoBeCompilerRealizeTemplate } from "@autobe/compiler/src/raw/AutoBeCompilerRealizeTemplate";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeExampleProject,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeCollectorPlan,
} from "@autobe/interface";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { ArchiveLogger } from "../../../archive/utils/ArchiveLogger";
import { prepare_agent_realize } from "./prepare_agent_realize";

export const validate_agent_realize_collector_write = async (props: {
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

  const plans: AutoBeRealizeCollectorPlan[] =
    await orchestrateRealizeCollectorPlan(agent.getContext(), {
      progress: {
        total: 0,
        completed: 0,
      },
    });
  const collectors: AutoBeRealizeCollectorFunction[] =
    await orchestrateRealizeCollectorWrite(agent.getContext(), {
      plans,
      progress: {
        total: 0,
        completed: 0,
      },
    });
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/realize-collector`,
    files: {
      ...(await agent.getFiles()),
      ...AutoBeCompilerRealizeTemplate,
      ...Object.fromEntries(
        collectors
          .filter((w) => w !== null)
          .map((c) => [c.location, c.content]),
      ),
      "pnpm-workspace.yaml": "",
    },
  });
};
