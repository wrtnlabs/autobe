import {
  IAutoBePlaygroundVendor,
  IAutoBePlaygroundVendorModel,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { TestValidator } from "@nestia/e2e";

export const test_api_playground_vendor_model_erase = async (
  connection: pApi.IConnection,
): Promise<void> => {
  // Create own vendor for destructive test
  const vendor: IAutoBePlaygroundVendor =
    await pApi.functional.autobe.playground.vendors.create(connection, {
      name: "Model Erase Target",
      apiKey: "test-dummy-key",
      baseURL: "http://localhost:1234",
      semaphore: 16,
    });

  // Creating a session auto-registers the model under the vendor
  await pApi.functional.autobe.playground.sessions.create(connection, {
    vendor_id: vendor.id,
    model: "openai/gpt-4.1-mini",
    locale: "en-US",
    timezone: "Asia/Seoul",
    title: "Model Erase Test",
  });

  const models: IAutoBePlaygroundVendorModel[] =
    await pApi.functional.autobe.playground.vendors.models.index(
      connection,
      vendor.id,
    );
  const target = models.find((m) => m.model === "openai/gpt-4.1-mini");
  TestValidator.predicate("model exists", () => target !== undefined);

  await pApi.functional.autobe.playground.vendors.models.erase(
    connection,
    vendor.id,
    target!.id,
  );

  const after: IAutoBePlaygroundVendorModel[] =
    await pApi.functional.autobe.playground.vendors.models.index(
      connection,
      vendor.id,
    );
  TestValidator.predicate("not in list", () =>
    after.every((m) => m.id !== target!.id),
  );
};
