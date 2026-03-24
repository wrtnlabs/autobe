import {
  IAutoBePlaygroundSession,
  IAutoBePlaygroundVendor,
  IAutoBeRpcListener,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { TestValidator } from "@nestia/e2e";
import { sleep_for } from "tstl";

import { TestVendor } from "../../../internal/TestVendor";

export const test_api_playground_session_connect_duplicate = async (
  connection: pApi.IConnection,
): Promise<void> => {
  const vendor: IAutoBePlaygroundVendor = await TestVendor.get(connection);

  const session: IAutoBePlaygroundSession =
    await pApi.functional.autobe.playground.sessions.create(connection, {
      vendor_id: vendor.id,
      model: "qwen3-coder-next",
      locale: "en-US",
      timezone: "Asia/Seoul",
      title: "Duplicate Connection Test",
    });

  const listener: IAutoBeRpcListener = {
    assistantMessage: async () => {},
    enable: async () => {},
  };

  // 1st connection — should succeed
  const { connector } =
    await pApi.functional.autobe.playground.sessions.connect(
      connection,
      session.id,
      listener,
    );

  // 2nd connection — should be rejected (duplicate)
  await TestValidator.error("duplicate connection rejected", () =>
    pApi.functional.autobe.playground.sessions.connect(
      connection,
      session.id,
      listener,
    ),
  );

  // Close the 1st connection
  await connector.close();
  await sleep_for(500);

  // 3rd connection — should succeed again (1st was closed)
  const { connector: connector2 } =
    await pApi.functional.autobe.playground.sessions.connect(
      connection,
      session.id,
      listener,
    );
  await connector2.close();
};
