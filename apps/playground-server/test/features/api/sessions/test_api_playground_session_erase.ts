import {
  IAutoBePlaygroundSession,
  IAutoBePlaygroundVendor,
  IPage,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { TestValidator } from "@nestia/e2e";

import { TestVendor } from "../../../internal/TestVendor";

export const test_api_playground_session_erase = async (
  connection: pApi.IConnection,
): Promise<void> => {
  const vendor: IAutoBePlaygroundVendor = await TestVendor.get(connection);

  const session: IAutoBePlaygroundSession =
    await pApi.functional.autobe.playground.sessions.create(connection, {
      vendor_id: vendor.id,
      model: "qwen3-coder-next",
      locale: "en-US",
      timezone: "Asia/Seoul",
      title: "Erase Target Session",
    });

  await pApi.functional.autobe.playground.sessions.erase(
    connection,
    session.id,
  );

  await TestValidator.error("erased session not found", () =>
    pApi.functional.autobe.playground.sessions.at(connection, session.id),
  );

  const page: IPage<IAutoBePlaygroundSession.ISummary> =
    await pApi.functional.autobe.playground.sessions.index(connection, {
      limit: 100,
      page: 1,
    });
  TestValidator.predicate("not in list", () =>
    page.data.every((s) => s.id !== session.id),
  );
};
