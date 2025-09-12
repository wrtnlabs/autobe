import { AutoBeTokenUsage, orchestrate } from "@autobe/agent";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeAssistantMessageHistory,
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeInterfaceHistory,
} from "@autobe/interface";
import { AutoBeInterfaceGroup } from "@autobe/interface/src/histories/contents/AutoBeInterfaceGroup";
import typia from "typia";

import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { prepare_agent_interface } from "../../features/interface/internal/prepare_agent_interface";
import { TestHistory } from "../../internal/TestHistory";
import { TestLogger } from "../../internal/TestLogger";
import { TestProject } from "../../structures/TestProject";

export const archive_interface = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent, zero } = await prepare_agent_interface(factory, project);
  const snapshots: AutoBeEventSnapshot[] = [];
  const start: Date = new Date();

  const listen = (event: AutoBeEventOfSerializable) => {
    if (TestGlobal.archive) TestLogger.event(start, event);
    snapshots.push({
      event,
      tokenUsage: agent.getTokenUsage().toJSON(),
    });
  };
  for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, listen);
  agent.on("vendorResponse", (e) => TestLogger.event(start, e));

  // REQUEST INTERFACE GENERATION
  const result: AutoBeInterfaceHistory | AutoBeAssistantMessageHistory =
    await orchestrate.interface(agent.getContext())({
      reason: "Step to the interface designing after DB schema generation",
    });
  console.log("The interface result history", result);
  if (result.type !== "interface")
    throw new Error("History type must be interface.");

  // REPORT RESULT
  const model: string = TestGlobal.vendorModel;
  try {
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${model}/${project}/interface`,
      files: {
        ...(await agent.getFiles()),
        "pnpm-workspace.yaml": "",
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
  } catch {}
  if (TestGlobal.archive) {
    await TestHistory.save({
      [`${project}.interface.json`]: JSON.stringify(agent.getHistories()),
      [`${project}.interface.snapshots.json`]: JSON.stringify(
        snapshots.map((s) => ({
          event: s.event,
          tokenUsage: new AutoBeTokenUsage(s.tokenUsage)
            .increment(zero)
            .toJSON(),
        })),
      ),
      [`${project}.interface.groups.json`]: JSON.stringify(
        snapshots
          .map((s) => s.event)
          .filter((e) => e.type === "interfaceGroups")
          .map((e) => e.groups)
          .flat() satisfies AutoBeInterfaceGroup[],
      ),
      [`${project}.interface.endpoints.json`]: JSON.stringify(
        snapshots
          .map((s) => s.event)
          .filter((e) => e.type === "interfaceEndpoints")
          .map((e) => e.endpoints)
          .flat(),
      ),
      [`${project}.interface.operations.json`]: JSON.stringify(
        result.document.operations,
      ),
      [`${project}.interface.schemas.json`]: JSON.stringify(
        Object.fromEntries(
          snapshots
            .map((s) => s.event)
            .filter((e) => e.type === "interfaceSchemas")
            .map((e) => Object.entries(e.schemas)),
        ),
      ),
    });
  }
};
