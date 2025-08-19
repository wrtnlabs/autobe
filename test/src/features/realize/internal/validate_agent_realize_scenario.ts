import { orchestrateRealizeScenario } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeScenario";
import { IAutoBeRealizeScenarioApplication } from "@autobe/agent/src/orchestrate/realize/structures/IAutoBeRealizeScenarioApplication";
import { CompressUtil } from "@autobe/filesystem";
import {
  AutoBeEvent,
  AutoBeEventSnapshot,
  AutoBeOpenApi,
  AutoBeRealizeAuthorization,
} from "@autobe/interface";
import fs from "fs";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestLogger } from "../../../internal/TestLogger";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_realize } from "./prepare_agent_realize";

export const validate_agent_realize_scenario = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent } = await prepare_agent_realize(factory, project);
  const start: Date = new Date();
  const snapshots: AutoBeEventSnapshot[] = [];
  const listen = (event: AutoBeEvent) => {
    if (TestGlobal.archive) TestLogger.event(start, event);
    snapshots.push({
      event,
      tokenUsage: agent.getTokenUsage().toJSON(),
    });
  };

  agent.on("assistantMessage", listen);
  for (const type of typia.misc.literals<AutoBeEvent.Type>())
    if (type.startsWith("realize")) agent.on(type, listen);

  const model: string = TestGlobal.getVendorModel();
  const operations: AutoBeOpenApi.IOperation[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${TestGlobal.ROOT}/assets/histories/${model}/${project}.interface.operations.json.gz`,
      ),
    ),
  );

  const authorizations: AutoBeRealizeAuthorization[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${TestGlobal.ROOT}/assets/histories/${model}/${project}.realize.authorization-correct.json.gz`,
      ),
    ),
  );

  const scenarios: IAutoBeRealizeScenarioApplication.IProps[] = operations.map(
    (operation) => {
      const autohrization = authorizations.find(
        (el) => el.role.name === operation.authorizationRole,
      );

      return orchestrateRealizeScenario(
        agent.getContext(),
        operation,
        autohrization,
      );
    },
  );

  if (TestGlobal.archive)
    await TestHistory.save({
      [`${project}.realize.scenarios.json`]: JSON.stringify(scenarios),
    });
};
