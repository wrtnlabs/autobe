import {
  IAutoBePlaygroundSession,
  IAutoBePlaygroundVendor,
  IAutoBeRpcListener,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { RandomGenerator, TestValidator } from "@nestia/e2e";
import { IPointer, sleep_for } from "tstl";
import { v7 } from "uuid";

import { AutoBePlaygroundGlobal } from "../../../../src/AutoBePlaygroundGlobal";

export const test_api_playground_session_connect_after_vendor_erase = async (
  connection: pApi.IConnection,
): Promise<void> => {
  const vendor: IAutoBePlaygroundVendor =
    await pApi.functional.autobe.playground.vendors.create(connection, {
      name: RandomGenerator.name(),
      apiKey: RandomGenerator.alphaNumeric(32),
      baseURL: "http://localhost:1234",
      semaphore: 16,
    });

  // Create a session under this vendor
  const session: IAutoBePlaygroundSession =
    await pApi.functional.autobe.playground.sessions.create(connection, {
      vendor_id: vendor.id,
      model: "qwen3.5-35b-a3b",
      locale: "en-US",
      timezone: "Asia/Seoul",
      title: "Vendor Deletion Test",
    });

  // Insert a closed connection record so replay can find one
  await AutoBePlaygroundGlobal.prisma.autobe_playground_session_connections.create(
    {
      data: {
        id: v7(),
        autobe_playground_session_id: session.id,
        created_at: new Date(),
        disconnected_at: new Date(),
      },
    },
  );

  // Soft-delete the vendor
  await pApi.functional.autobe.playground.vendors.erase(connection, vendor.id);

  const enabled: IPointer<boolean | null> = { value: null };
  const listener: IAutoBeRpcListener = {
    assistantMessage: async () => {},
    enable: async (v) => {
      enabled.value = v;
    },
  };

  // Connect should be REJECTED (vendor is soft-deleted)
  await TestValidator.error("connect rejected for deleted vendor", () =>
    pApi.functional.autobe.playground.sessions.connect(
      connection,
      session.id,
      listener,
    ),
  );

  // Replay should SUCCEED even with garbage API key + deleted vendor
  const { connector } = await pApi.functional.autobe.playground.sessions.replay(
    connection,
    session.id,
    listener,
  );

  // Wait for enable(false) RPC call to arrive
  while (enabled.value === null) await sleep_for(100);

  // Replay sends enable(false) — read-only mode
  TestValidator.equals("replay is read-only", enabled.value, false);

  await connector.close();
};
