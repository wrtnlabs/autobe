import { orchestrateRealizeWrite } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeWrite";
import { IAutoBeRealizeScenarioResult } from "@autobe/agent/src/orchestrate/realize/structures/IAutoBeRealizeScenarioResult";
import { executeCachedBatch } from "@autobe/agent/src/utils/executeCachedBatch";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { CompressUtil, FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeRealizeAuthorization,
  AutoBeRealizeWriteEvent,
} from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import fs from "fs";
import typia from "typia";
import { v7 } from "uuid";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { ArchiveLogger } from "../../../archive/utils/ArchiveLogger";
import { prepare_agent_realize } from "./prepare_agent_realize";

export const validate_agent_realize_write = async (props: {
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
    if (type.startsWith("realize")) agent.on(type, listen);

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

  const progress = { id: v7(), total: scenarios.length, completed: 0 };
  const writes: (AutoBeRealizeWriteEvent | null)[] = await executeCachedBatch(
    agent.getContext(),
    scenarios.map((scenario) => async (promptCacheKey) => {
      const authorization = authorizations.find(
        (a) => a.actor.name === scenario.decoratorEvent?.actor.name,
      );
      try {
        const write: AutoBeRealizeWriteEvent = await orchestrateRealizeWrite(
          agent.getContext(),
          {
            document: agent.getContext().state().interface!.document,
            totalAuthorizations: authorizations,
            authorization: authorization ?? null,
            progress,
            scenario,
            promptCacheKey,
          },
        );
        return write;
      } catch (err) {
        return null;
      }
    }),
  );

  const locations = writes.filter((w) => w !== null).map((el) => el.location);
  const rejected = scenarios.filter((s) => !locations.includes(s.location));

  const retried = await executeCachedBatch(
    agent.getContext(),
    rejected.map((scenario) => async (promptCacheKey) => {
      const authorization = authorizations.find(
        (a) => a.actor.name === scenario.decoratorEvent?.actor.name,
      );
      try {
        const write: AutoBeRealizeWriteEvent = await orchestrateRealizeWrite(
          agent.getContext(),
          {
            totalAuthorizations: authorizations,
            document: agent.getContext().state().interface!.document,
            authorization: authorization ?? null,
            progress,
            scenario,
            promptCacheKey,
          },
        );
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
      ...Object.fromEntries(retried.map((el) => [el?.location, el?.content])),
    },
  });

  if (TestGlobal.archive)
    await AutoBeExampleStorage.save({
      vendor: props.vendor,
      project: props.project,
      files: {
        [`realize.writes.json`]: JSON.stringify(
          [...writes, ...retried].filter((w) => w !== null),
        ),
      },
    });
};

export interface IProgress {
  total: number;
  completed: number;
}
