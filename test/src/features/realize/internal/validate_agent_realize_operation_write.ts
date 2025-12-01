import { AutoBeAgent } from "@autobe/agent";
import { orchestrateRealizeAuthorizationWrite } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeAuthorizationWrite";
import { orchestrateRealizeCollectorPlan } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeCollectorPlan";
import { orchestrateRealizeCollectorWrite } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeCollectorWrite";
import { orchestrateRealizeOperationWrite } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeOperationWrite";
import { orchestrateRealizeTransformerPlan } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeTransformerPlan";
import { orchestrateRealizeTransformerWrite } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeTransformerWrite";
import { IAutoBeRealizeScenarioResult } from "@autobe/agent/src/orchestrate/realize/structures/IAutoBeRealizeScenarioResult";
import { executeCachedBatch } from "@autobe/agent/src/utils/executeCachedBatch";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { CompressUtil, FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeCollectorPlan,
  AutoBeRealizeTransformerFunction,
  AutoBeRealizeTransformerPlan,
  AutoBeRealizeWriteEvent,
} from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { ArchiveLogger } from "../../../archive/utils/ArchiveLogger";
import { IEntitySchema } from "./IEntitySchema";
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

  const collector = await getCollectors(agent);
  const transformers = await getTransformers(agent);
  const writes: AutoBeRealizeWriteEvent[] = [];

  const authorizations: AutoBeRealizeAuthorization[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${AutoBeExampleStorage.getDirectory(props)}/realize.authorization-correct.json.gz`,
      ),
    ),
  );

  const scenarios: IAutoBeRealizeScenarioResult[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${AutoBeExampleStorage.getDirectory(props)}/realize.scenarios.json.gz`,
      ),
    ),
  );

  const progress: AutoBeProgressEventBase = {
    total: scenarios.length,
    completed: 0,
  };
  const writes: (AutoBeRealizeWriteEvent | null)[] = await executeCachedBatch(
    agent.getContext(),
    scenarios.map((scenario) => async (promptCacheKey) => {
      const authorization = authorizations.find(
        (a) => a.actor.name === scenario.decoratorEvent?.actor.name,
      );
      try {
        const write: AutoBeRealizeWriteEvent =
          await orchestrateRealizeOperationWrite(agent.getContext(), {
            document: agent.getContext().state().interface!.document,
            totalAuthorizations: authorizations,
            authorization: authorization ?? null,
            progress,
            scenario,
            promptCacheKey,
          });
        return write;
      } catch (err) {
        return null;
      }
    }),
  );

  const locations = writes
    .filter((w) => w !== null)
    .map((el) => el.function.location);
  const rejected = scenarios.filter((s) => !locations.includes(s.location));

  const retried = await executeCachedBatch(
    agent.getContext(),
    rejected.map((scenario) => async (promptCacheKey) => {
      const authorization = authorizations.find(
        (a) => a.actor.name === scenario.decoratorEvent?.actor.name,
      );
      try {
        const write: AutoBeRealizeWriteEvent =
          await orchestrateRealizeOperationWrite(agent.getContext(), {
            totalAuthorizations: authorizations,
            document: agent.getContext().state().interface!.document,
            authorization: authorization ?? null,
            progress,
            scenario,
            promptCacheKey,
          });
        return write;
      } catch (err) {
        return null;
      }
    }),
  );

  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/${props.project}/realize/authorization-correct`,
    files: {
      ...(await agent.getFiles()),
      ...Object.fromEntries(
        retried.map((el) => [el?.function.location, el?.function.content]),
      ),
      "src/api/structures/IEntity.ts": JSON.stringify(IEntitySchema),
    },
  });
};

const getAuthorizations = <Model extends ILlmSchema.Model>(
  agent: AutoBeAgent<Model>,
): Promise<AutoBeRealizeAuthorization[]> =>
  orchestrateRealizeAuthorizationWrite(agent.getContext());

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
  const events: AutoBeRealizeWriteEvent[] =
    await orchestrateRealizeCollectorWrite(agent.getContext(), {
      plans,
      progress: {
        total: 0,
        completed: 0,
      },
    });
  return events.map((e) => e.function).filter((f) => f.kind === "collector");
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
  const events: AutoBeRealizeWriteEvent[] =
    await orchestrateRealizeTransformerWrite(agent.getContext(), {
      plans,
      progress: {
        total: 0,
        completed: 0,
      },
    });
  return events.map((e) => e.function).filter((f) => f.kind === "transformer");
};
