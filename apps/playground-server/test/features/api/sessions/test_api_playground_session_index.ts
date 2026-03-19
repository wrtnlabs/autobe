import {
  IAutoBePlaygroundSession,
  IAutoBePlaygroundVendor,
  IPage,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { TestValidator } from "@nestia/e2e";

import { TestVendor } from "../../../internal/TestVendor";

export const test_api_playground_session_index = async (
  connection: pApi.IConnection,
): Promise<void> => {
  const vendor: IAutoBePlaygroundVendor = await TestVendor.get(connection);

  const session: IAutoBePlaygroundSession =
    await pApi.functional.autobe.playground.sessions.create(connection, {
      vendor_id: vendor.id,
      model: "openai/gpt-4.1-mini",
      locale: "en-US",
      timezone: "Asia/Seoul",
      title: "Index Test Session",
    });

  const page: IPage<IAutoBePlaygroundSession.ISummary> =
    await pApi.functional.autobe.playground.sessions.index(connection, {
      limit: 100,
      page: 1,
    });
  TestValidator.predicate("has data", () => page.data.length > 0);
  TestValidator.predicate("contains created session", () =>
    page.data.some((s) => s.id === session.id),
  );
};
