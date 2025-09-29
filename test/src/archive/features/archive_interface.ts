import { AutoBeTokenUsage } from "@autobe/agent";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBeInterfaceHistory,
  AutoBeUserMessageContent,
  AutoBeUserMessageHistory,
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

  const userMessage: AutoBeUserMessageHistory =
    await TestHistory.getUserMessage(project, "interface");
  const go = (
    c: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
  ) => agent.conversate(c);

  // REQUEST INTERFACE GENERATION
  let histories: AutoBeHistory[] = await go(userMessage.contents);
  if (histories.every((h) => h.type !== "interface")) {
    histories = await go("Don't ask me to do that, and just do it right now.");
    if (histories.every((h) => h.type !== "interface"))
      throw new Error("History type must be interface.");
  }
  const result: AutoBeInterfaceHistory = histories.find(
    (h) => h.type === "interface",
  )!;

  // REPORT RESULT
  const model: string = TestGlobal.vendorModel;
  try {
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${model}/${project}/interface`,
      files: {
        ...(await agent.getFiles()),
        "pnpm-workspace.yaml": "",
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
            .map((e) => Object.entries(e.schemas))
            .flat(),
        ),
      ),
    });
  }
};
