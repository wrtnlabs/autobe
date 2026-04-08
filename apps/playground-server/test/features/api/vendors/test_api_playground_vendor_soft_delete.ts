import {
  IAutoBePlaygroundSession,
  IAutoBePlaygroundVendor,
  IAutoBeRpcListener,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { RandomGenerator, TestValidator } from "@nestia/e2e";
import { IPointer, sleep_for } from "tstl";

export const test_api_playground_vendor_soft_delete = async (
  connection: pApi.IConnection,
): Promise<void> => {
  const vendor: IAutoBePlaygroundVendor =
    await pApi.functional.autobe.playground.vendors.create(connection, {
      name: RandomGenerator.name(),
      apiKey: RandomGenerator.alphaNumeric(32),
      baseURL: "http://localhost:1234",
      semaphore: 16,
    });
  TestValidator.equals("initially null", vendor.deleted_at, null);

  // Create a session under this vendor
  const session: IAutoBePlaygroundSession =
    await pApi.functional.autobe.playground.sessions.create(connection, {
      vendor_id: vendor.id,
      model: "qwen3-coder-next",
      locale: "en-US",
      timezone: "Asia/Seoul",
      title: "Vendor Soft Delete Test",
    });

  // Connect once to establish a connection record, then close
  const listener: IAutoBeRpcListener = {
    assistantMessage: async () => {},
    enable: async () => {},
  };
  const { connector } =
    await pApi.functional.autobe.playground.sessions.connect(
      connection,
      session.id,
      listener,
    );
  await connector.close();
  await sleep_for(500);

  // Soft-delete the vendor
  await pApi.functional.autobe.playground.vendors.erase(connection, vendor.id);

  // 1) Verify vendor.at() no longer accessible
  await TestValidator.error("erased vendor not found via at()", () =>
    pApi.functional.autobe.playground.vendors.at(connection, vendor.id),
  );

  // 2) Verify deleted_at is set in session's vendor record
  const read: IAutoBePlaygroundSession =
    await pApi.functional.autobe.playground.sessions.at(connection, session.id);
  TestValidator.predicate(
    "vendor.deleted_at is set",
    () => read.vendor.deleted_at !== null,
  );

  // 3) Connect should be rejected (vendor soft-deleted)
  await TestValidator.error("connect rejected for deleted vendor", () =>
    pApi.functional.autobe.playground.sessions.connect(
      connection,
      session.id,
      listener,
    ),
  );

  // 4) Replay should still succeed
  const enabled: IPointer<boolean | null> = { value: null };
  const replayListener: IAutoBeRpcListener = {
    assistantMessage: async () => {},
    enable: async (v) => {
      enabled.value = v;
    },
  };
  const { connector: replayConnector } =
    await pApi.functional.autobe.playground.sessions.replay(
      connection,
      session.id,
      replayListener,
    );
  await sleep_for(1_000);
  TestValidator.equals("replay enabled=false", enabled.value, false);
  await replayConnector.close();
};
