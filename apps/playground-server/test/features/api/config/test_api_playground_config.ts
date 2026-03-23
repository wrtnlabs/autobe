import { IAutoBePlaygroundConfig } from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { TestValidator } from "@nestia/e2e";

export const test_api_playground_config = async (
  connection: pApi.IConnection,
): Promise<void> => {
  // 1. GET should return default values (seeded on startup)
  const initial: IAutoBePlaygroundConfig =
    await pApi.functional.autobe.playground.config.get(connection);

  TestValidator.equals("default locale", initial.locale, "en-US");
  TestValidator.equals("default timezone", initial.timezone, "UTC");
  TestValidator.equals(
    "default_vendor_id is null",
    initial.default_vendor_id,
    null,
  );
  TestValidator.equals("default_model is null", initial.default_model, null);

  // 2. PUT partial update — only locale
  const afterLocale: IAutoBePlaygroundConfig =
    await pApi.functional.autobe.playground.config.update(connection, {
      locale: "ko-KR",
    });

  TestValidator.equals("locale updated", afterLocale.locale, "ko-KR");
  TestValidator.equals("timezone unchanged", afterLocale.timezone, "UTC");
  TestValidator.equals(
    "default_vendor_id still null",
    afterLocale.default_vendor_id,
    null,
  );
  TestValidator.equals(
    "default_model still null",
    afterLocale.default_model,
    null,
  );

  // 3. PUT partial update — only timezone
  const afterTimezone: IAutoBePlaygroundConfig =
    await pApi.functional.autobe.playground.config.update(connection, {
      timezone: "Asia/Seoul",
    });

  TestValidator.equals("locale persisted", afterTimezone.locale, "ko-KR");
  TestValidator.equals(
    "timezone updated",
    afterTimezone.timezone,
    "Asia/Seoul",
  );

  // 4. PUT with default_vendor_id and default_model
  const afterDefaults: IAutoBePlaygroundConfig =
    await pApi.functional.autobe.playground.config.update(connection, {
      default_vendor_id: "00000000-0000-0000-0000-000000000001",
      default_model: "qwen3-coder-next",
    });

  TestValidator.equals(
    "default_vendor_id set",
    afterDefaults.default_vendor_id,
    "00000000-0000-0000-0000-000000000001",
  );
  TestValidator.equals(
    "default_model set",
    afterDefaults.default_model,
    "qwen3-coder-next",
  );

  // 5. GET reflects all updates
  const final: IAutoBePlaygroundConfig =
    await pApi.functional.autobe.playground.config.get(connection);

  TestValidator.equals("final locale", final.locale, "ko-KR");
  TestValidator.equals("final timezone", final.timezone, "Asia/Seoul");
  TestValidator.equals(
    "final default_vendor_id",
    final.default_vendor_id,
    "00000000-0000-0000-0000-000000000001",
  );
  TestValidator.equals(
    "final default_model",
    final.default_model,
    "qwen3-coder-next",
  );

  // 6. PUT null to clear optional fields
  const afterClear: IAutoBePlaygroundConfig =
    await pApi.functional.autobe.playground.config.update(connection, {
      default_vendor_id: null,
      default_model: null,
    });

  TestValidator.equals(
    "default_vendor_id cleared",
    afterClear.default_vendor_id,
    null,
  );
  TestValidator.equals("default_model cleared", afterClear.default_model, null);

  // 7. Restore defaults for other tests
  await pApi.functional.autobe.playground.config.update(connection, {
    locale: "en-US",
    timezone: "UTC",
  });
};
