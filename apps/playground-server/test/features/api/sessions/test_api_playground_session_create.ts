import {
  IAutoBePlaygroundSession,
  IAutoBePlaygroundVendor,
  IPage,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { TestValidator } from "@nestia/e2e";

import { TestVendor } from "../../../internal/TestVendor";

export const test_api_playground_session_create = async (
  connection: pApi.IConnection,
): Promise<void> => {
  const vendor: IAutoBePlaygroundVendor = await TestVendor.get(connection);

  const session: IAutoBePlaygroundSession =
    await pApi.functional.autobe.playground.sessions.create(connection, {
      vendor_id: vendor.id,
      model: "openai/gpt-4.1-mini",
      locale: "en-US",
      timezone: "Asia/Seoul",
      title: "My First Session",
    } satisfies IAutoBePlaygroundSession.ICreate);

  TestValidator.predicate("id exists", () => session.id.length > 0);
  TestValidator.equals("vendor.id", session.vendor.id, vendor.id);
  TestValidator.equals("model", session.model, "openai/gpt-4.1-mini");
  TestValidator.equals("locale", session.locale, "en-US");
  TestValidator.equals("timezone", session.timezone, "Asia/Seoul");
  TestValidator.equals("title", session.title, "My First Session");
  TestValidator.equals("phase", session.phase, null);

  const read: IAutoBePlaygroundSession =
    await pApi.functional.autobe.playground.sessions.at(connection, session.id);
  TestValidator.equals("read.id", read.id, session.id);

  const page: IPage<IAutoBePlaygroundSession.ISummary> =
    await pApi.functional.autobe.playground.sessions.index(connection, {
      limit: 1,
      page: 1,
    });
  TestValidator.predicate("in page", () =>
    page.data.some((s) => s.id === session.id),
  );
};
