import { orchestrate } from "@autobe/agent";
import { OpenApiEndpointComparator } from "@autobe/agent/src/orchestrate/interface/utils/OpenApiEndpointComparator";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAssistantMessageHistory,
  AutoBeEvent,
  AutoBeEventSnapshot,
  AutoBeInterfaceHistory,
} from "@autobe/interface";
import { AutoBeInterfaceGroup } from "@autobe/interface/src/histories/contents/AutoBeInterfaceGroup";
import fs from "fs";
import { HashSet } from "tstl";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_interface } from "./prepare_agent_interface";

export const validate_agent_interface_main = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent } = await prepare_agent_interface(factory, project);
  const snapshots: AutoBeEventSnapshot[] = [];
  const listen = (event: AutoBeEvent) => {
    snapshots.push({
      event,
      tokenUsage: agent.getTokenUsage().toJSON(),
    });
  };
  agent.on("interfaceStart", listen);
  agent.on("interfaceGroups", listen);
  agent.on("interfaceEndpoints", listen);
  agent.on("interfaceOperations", listen);
  agent.on("interfaceSchemas", listen);
  agent.on("interfaceComplement", listen);
  agent.on("interfaceComplete", listen);

  // REQUEST INTERFACE GENERATION
  const go = (reason: string) =>
    orchestrate.interface(agent.getContext())({
      reason,
    });
  let result: AutoBeInterfaceHistory | AutoBeAssistantMessageHistory = await go(
    "Step to the interface designing after DB schema generation",
  );
  if (result.type !== "interface") {
    result = await go("Don't ask me to do that, and just do it right now.");
    if (result.type !== "interface")
      throw new Error("History type must be interface.");
  }

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${project}/interface/main`,
    files: {
      ...(await agent.getFiles()),
      "logs/snapshots.json": JSON.stringify(snapshots),
      "logs/result.json": JSON.stringify(result),
      "logs/endpoints.json": JSON.stringify(
        snapshots
          .map((s) => s.event)
          .filter((e) => e.type === "interfaceEndpoints")
          .map((e) => e.endpoints)
          .flat(),
        null,
        2,
      ),
      "logs/operation-endpoints.json": JSON.stringify(
        result.document.operations.map((op) => ({
          path: op.path,
          method: op.method,
        })),
        null,
        2,
      ),
    },
  });
  if (process.argv.includes("--archive")) {
    await fs.promises.writeFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.interface.json`,
      JSON.stringify(agent.getHistories()),
      "utf8",
    );
    await fs.promises.writeFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.interface.snapshots.json`,
      JSON.stringify(snapshots),
      "utf8",
    );
    await fs.promises.writeFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.interface.groups.json`,
      JSON.stringify(
        snapshots
          .map((s) => s.event)
          .filter((e) => e.type === "interfaceGroups")
          .map((e) => e.groups)
          .flat() satisfies AutoBeInterfaceGroup[],
      ),
    );
    await fs.promises.writeFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.interface.endpoints.json`,
      JSON.stringify(
        new HashSet(
          snapshots
            .map((s) => s.event)
            .filter((e) => e.type === "interfaceEndpoints")
            .map((e) => e.endpoints)
            .flat(),
          OpenApiEndpointComparator.hashCode,
          OpenApiEndpointComparator.equals,
        ).toJSON(),
      ),
      "utf8",
    );
    await fs.promises.writeFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.interface.operations.json`,
      JSON.stringify(result.document.operations),
      "utf8",
    );
    await fs.promises.writeFile(
      `${TestGlobal.ROOT}/assets/histories/${project}.interface.schemas.json`,
      JSON.stringify(
        Object.fromEntries(
          snapshots
            .map((s) => s.event)
            .filter((e) => e.type === "interfaceSchemas")
            .map((e) => Object.entries(e.schemas)),
        ),
      ),
      "utf8",
    );
  }
};
