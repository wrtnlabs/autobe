import { IAutoBeRealizeScenarioResult } from "@autobe/agent/src/orchestrate/realize/structures/IAutoBeRealizeScenarioResult";
import { generateRealizeScenario } from "@autobe/agent/src/orchestrate/realize/utils/generateRealizeScenario";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { CompressUtil } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeOpenApi,
  AutoBeRealizeAuthorization,
} from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { ArchiveLogger } from "../../../archive/utils/ArchiveLogger";
import { prepare_agent_realize } from "./prepare_agent_realize";

export const validate_agent_realize_scenario = async (props: {
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

  const operations: AutoBeOpenApi.IOperation[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${AutoBeExampleStorage.getDirectory(props)}/interface.operations.json.gz`,
      ),
    ),
  );

  const authorizations: AutoBeRealizeAuthorization[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${AutoBeExampleStorage.getDirectory(props)}/realize.authorization-correct.json.gz`,
      ),
    ),
  );

  const scenarios: IAutoBeRealizeScenarioResult[] = operations.map(
    (operation) => {
      return generateRealizeScenario(operation, authorizations);
    },
  );

  if (TestGlobal.archive)
    await AutoBeExampleStorage.save({
      vendor: props.vendor,
      project: props.project,
      files: {
        [`realize.scenarios.json`]: JSON.stringify(scenarios),
      },
    });
};
