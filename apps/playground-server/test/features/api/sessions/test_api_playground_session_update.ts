import {
  IAutoBePlaygroundSession,
  IAutoBePlaygroundVendor,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { TestValidator } from "@nestia/e2e";

import { TestVendor } from "../../../internal/TestVendor";

export const test_api_playground_session_update = async (
  connection: pApi.IConnection,
): Promise<void> => {
  const vendor: IAutoBePlaygroundVendor = await TestVendor.get(connection);

  const session: IAutoBePlaygroundSession =
    await pApi.functional.autobe.playground.sessions.create(connection, {
      vendor_id: vendor.id,
      model: "openai/gpt-4.1-mini",
      locale: "en-US",
      timezone: "Asia/Seoul",
      title: "Update Target Session",
    });

  await pApi.functional.autobe.playground.sessions.update(
    connection,
    session.id,
    {
      title: "Updated Session Title",
    },
  );

  const read: IAutoBePlaygroundSession =
    await pApi.functional.autobe.playground.sessions.at(connection, session.id);
  TestValidator.equals("title", read.title, "Updated Session Title");
};
