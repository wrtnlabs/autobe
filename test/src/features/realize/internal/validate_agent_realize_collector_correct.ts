import { orchestrateRealizeCorrectCasting } from "@autobe/agent/src/orchestrate/realize/internal/orchestrateRealizeCorrectCasting";
import { orchestrateRealizeCollectorPlan } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeCollectorPlan";
import { orchestrateRealizeCollectorWrite } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeCollectorWrite";
import { AutoBeRealizeCollectorProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeCollectorProgrammer";
import { AutoBeCompilerRealizeTemplate } from "@autobe/compiler/src/raw/AutoBeCompilerRealizeTemplate";
import { AutoBeCompilerRealizeTemplateOfSQLite } from "@autobe/compiler/src/raw/AutoBeCompilerRealizeTemplateOfSQLite";
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
import { TestStorage } from "../../../TestStorage";
import { ArchiveLogger } from "../../../archive/utils/ArchiveLogger";
import { prepare_agent_realize } from "./prepare_agent_realize";

export const validate_agent_realize_collector_correct = async (props: {
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

  const plans: AutoBeRealizeCollectorPlan[] = await TestStorage.emplace(
    {
      vendor: props.vendor,
      project: props.project,
      file: "realize.collector.plan",
    },
    () =>
      orchestrateRealizeCollectorPlan(agent.getContext(), {
        progress: {
          total: 0,
          completed: 0,
        },
      }),
  );
  const writes: AutoBeRealizeCollectorFunction[] = await TestStorage.emplace(
    {
      vendor: props.vendor,
      project: props.project,
      file: "realize.collector.write",
    },
    () =>
      orchestrateRealizeCollectorWrite(agent.getContext(), {
        plans,
        progress: {
          total: 0,
          completed: 0,
        },
      }),
  );
  const corrects: AutoBeRealizeCollectorFunction[] =
    await orchestrateRealizeCorrectCasting(agent.getContext(), {
      programmer: {
        template: (func) =>
          AutoBeRealizeCollectorProgrammer.getTemplate(func.plan),
        replaceImportStatements: (next) =>
          AutoBeRealizeCollectorProgrammer.replaceImportStatements(
            agent.getContext(),
            {
              dtoTypeName: next.function.plan.dtoTypeName,
              schemas: agent.getContext().state().interface!.document.components
                .schemas,
              code: next.code,
            },
          ),
        additional: () => ({}),
        location: "src/collectors",
      },
      functions: writes,
      progress: {
        total: 0,
        completed: 0,
      },
    });

  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/collector-correct`,
    files: {
      ...(await agent.getFiles()),
      ...AutoBeCompilerRealizeTemplate,
      ...AutoBeCompilerRealizeTemplateOfSQLite,
      ...Object.fromEntries(
        corrects.filter((c) => c !== null).map((c) => [c.location, c.content]),
      ),
      "pnpm-workspace.yaml": "",
    },
  });
};
