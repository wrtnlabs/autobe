import { AutoBeAgent } from "@autobe/agent";
import { orchestrateRealizeAuthorizationWrite } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeAuthorizationWrite";
import { orchestrateRealizeCollectorPlan } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeCollectorPlan";
import { orchestrateRealizeCollectorWrite } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeCollectorWrite";
import { orchestrateRealizeOperationWrite } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeOperationWrite";
import { orchestrateRealizeTransformerPlan } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeTransformerPlan";
import { orchestrateRealizeTransformerWrite } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeTransformerWrite";
import { AutoBeCompilerRealizeTemplate } from "@autobe/compiler/src/raw/AutoBeCompilerRealizeTemplate";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeOpenApi,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeCollectorPlan,
  AutoBeRealizeOperationFunction,
  AutoBeRealizeTransformerFunction,
  AutoBeRealizeTransformerPlan,
} from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { ArchiveLogger } from "../../../archive/utils/ArchiveLogger";
import { prepare_agent_realize } from "./prepare_agent_realize";

export const validate_agent_realize_operation_write = async (props: {
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

  const document: AutoBeOpenApi.IDocument = agent.getContext().state()
    .interface!.document;

  const authorizations: AutoBeRealizeAuthorization[] =
    await orchestrateRealizeAuthorizationWrite(agent.getContext());
  const collectors: AutoBeRealizeCollectorFunction[] =
    await getCollectors(agent);
  const transformers: AutoBeRealizeTransformerFunction[] =
    await getTransformers(agent);
  const operations: AutoBeRealizeOperationFunction[] =
    await orchestrateRealizeOperationWrite(agent.getContext(), {
      authorizations,
      collectors,
      transformers,
      progress: {
        completed: 0,
        total: document.operations.length,
      },
    });

  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/realize/realize-operation`,
    files: {
      ...(await agent.getFiles()),
      ...AutoBeCompilerRealizeTemplate,
      ...Object.fromEntries(
        authorizations
          .map((auth) => [
            [auth.decorator.location, auth.decorator.content],
            [auth.payload.location, auth.payload.content],
            [auth.provider.location, auth.provider.content],
          ])
          .flat(),
      ),
      ...Object.fromEntries(
        [...collectors, ...transformers, ...operations].map((func) => [
          func.location,
          func.content,
        ]),
      ),
    },
  });
};

const getCollectors = async <Model extends ILlmSchema.Model>(
  agent: AutoBeAgent<Model>,
): Promise<AutoBeRealizeCollectorFunction[]> => {
  const plans: AutoBeRealizeCollectorPlan[] =
    await orchestrateRealizeCollectorPlan(agent.getContext(), {
      progress: {
        total: 0,
        completed: 0,
      },
    });
  return await orchestrateRealizeCollectorWrite(agent.getContext(), {
    plans,
    progress: {
      total: 0,
      completed: 0,
    },
  });
};

const getTransformers = async <Model extends ILlmSchema.Model>(
  agent: AutoBeAgent<Model>,
): Promise<AutoBeRealizeTransformerFunction[]> => {
  const plans: AutoBeRealizeTransformerPlan[] =
    await orchestrateRealizeTransformerPlan(agent.getContext(), {
      progress: {
        total: 0,
        completed: 0,
      },
    });
  return await orchestrateRealizeTransformerWrite(agent.getContext(), {
    plans,
    progress: {
      total: 0,
      completed: 0,
    },
  });
};
