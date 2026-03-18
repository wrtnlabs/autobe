import { AutoBeExampleStorage } from "@autobe/benchmark";
import pApi from "@autobe/playground-api";
import {
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBePhase,
  IAutoBePlaygroundSession,
  IAutoBePlaygroundVendor,
} from "@autobe/interface";
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

export const test_api_playground_session_replay = async (
  connection: pApi.IConnection,
): Promise<void> => {
  // CREATE VENDOR
  const vendor: IAutoBePlaygroundVendor = await TestVendor.get(connection);

  // CREATE SESSION
  const created: IAutoBePlaygroundSession =
    await pApi.functional.autobe.playground.sessions.create(connection, {
      vendor_id: vendor.id,
      model: "openai/gpt-4.1-mini",
      locale: "en-US",
      timezone: "Asia/Seoul",
      title: "Replay Test",
    });

  // LOAD EXAMPLE DATA FROM STORAGE
  const model = "openai/gpt-4.1-mini";
  const project = "bbs";
  let phase: AutoBePhase | null = null;
  let histories: AutoBeHistory[] = [];
  const snapshots: AutoBeEventSnapshot[] = [];

  for (const p of SEQUENCE) {
    try {
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
      break;
    } catch {}
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

  // FETCH FULL SESSION AND VALIDATE REPLAY
  const session: IAutoBePlaygroundSession =
    await pApi.functional.autobe.playground.sessions.at(
      connection,
      created.id,
    );

  await validate_api_playground_session_replay(session, (listener) =>
    pApi.functional.autobe.playground.sessions.replay(
      connection,
      session.id,
      listener,
    ),
  );
};
