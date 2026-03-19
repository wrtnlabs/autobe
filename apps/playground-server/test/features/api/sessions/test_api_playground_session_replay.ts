import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeEventSnapshot,
  AutoBeExampleProject,
  AutoBeHistory,
  AutoBePhase,
  IAutoBePlaygroundSession,
  IAutoBePlaygroundVendor,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { v7 } from "uuid";

import { AutoBePlaygroundGlobal } from "../../../../src/AutoBePlaygroundGlobal";
import { AutoBePlaygroundSessionEventProvider } from "../../../../src/providers/sessions/AutoBePlaygroundSessionEventProvider";
import { AutoBePlaygroundSessionHistoryProvider } from "../../../../src/providers/sessions/AutoBePlaygroundSessionHistoryProvider";
import { TestVendor } from "../../../internal/TestVendor";
import { validate_api_playground_session_replay } from "../internal/validate_api_playground_session_replay";

const SEQUENCE: AutoBePhase[] = [
  "analyze",
  "database",
  "interface",
  "test",
  "realize",
];

const PROJECTS: AutoBeExampleProject[] = [
  "todo",
  "bbs",
  "reddit",
  "shopping",
  "chat",
  "account",
  "erp",
];

const findAvailableExample = async (): Promise<{
  model: string;
  project: AutoBeExampleProject;
} | null> => {
  const models = await AutoBeExampleStorage.getVendorModels();
  for (const model of models)
    for (const project of PROJECTS)
      if (
        await AutoBeExampleStorage.has({
          vendor: model,
          project,
          phase: "analyze",
        })
      )
        return { model, project };
  return null;
};

export const test_api_playground_session_replay = async (
  connection: pApi.IConnection,
): Promise<void> => {
  // FIND AVAILABLE EXAMPLE DATA
  const example = await findAvailableExample();
  if (example === null) throw new Error("No example data available.");
  const { model, project } = example;

  // CREATE VENDOR
  const vendor: IAutoBePlaygroundVendor = await TestVendor.get(connection);

  // CREATE SESSION
  const created: IAutoBePlaygroundSession =
    await pApi.functional.autobe.playground.sessions.create(connection, {
      vendor_id: vendor.id,
      model,
      locale: "en-US",
      timezone: "Asia/Seoul",
      title: "Replay Test",
    });

  // LOAD EXAMPLE DATA FROM STORAGE
  let phase: AutoBePhase | null = null;
  let histories: AutoBeHistory[] = [];
  const snapshots: AutoBeEventSnapshot[] = [];

  for (const p of SEQUENCE) {
    if (!(await AutoBeExampleStorage.has({ vendor: model, project, phase: p })))
      break;
    histories = await AutoBeExampleStorage.getHistories({
      vendor: model,
      project,
      phase: p,
    });
    for (const prev of SEQUENCE) {
      snapshots.push(
        ...(await AutoBeExampleStorage.getSnapshots({
          vendor: model,
          project,
          phase: prev,
        })),
      );
      if (prev === p) break;
    }
    phase = p;
  }
  if (phase === null) throw new Error("No example data available.");

  // INSERT INTO DB
  const conn =
    await AutoBePlaygroundGlobal.prisma.autobe_playground_session_connections.create(
      {
        data: {
          id: v7(),
          autobe_playground_session_id: created.id,
          created_at: new Date(),
          disconnected_at: null,
        },
      },
    );
  for (const history of histories)
    await AutoBePlaygroundSessionHistoryProvider.create({
      session: created,
      connection: conn,
      history,
    });
  for (const snapshot of snapshots)
    await AutoBePlaygroundSessionEventProvider.create({
      session: created,
      connection: conn,
      snapshot,
    });
  await AutoBePlaygroundGlobal.prisma.autobe_playground_session_aggregates.update(
    {
      where: { autobe_playground_session_id: created.id },
      data: {
        phase,
        enabled: true,
        token_usage: JSON.stringify(snapshots.at(-1)!.tokenUsage),
      },
    },
  );

  // VALIDATE REPLAY
  // NOTE: We skip sessions.at() because the full session with 1000+ snapshots
  // is too large for a single HTTP response. We already have the data we need.
  const session: IAutoBePlaygroundSession = {
    ...created,
    phase,
    histories,
    snapshots,
    token_usage: snapshots.at(-1)!.tokenUsage,
  };

  await validate_api_playground_session_replay(session, (listener) =>
    pApi.functional.autobe.playground.sessions.replay(
      connection,
      session.id,
      listener,
    ),
  );
};
