import {
  IAutoBePlaygroundVendor,
  IAutoBePlaygroundVendorModel,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { TestValidator } from "@nestia/e2e";

import { TestVendor } from "../../../internal/TestVendor";

export const test_api_playground_vendor_model_index = async (
  connection: pApi.IConnection,
): Promise<void> => {
  const vendor: IAutoBePlaygroundVendor = await TestVendor.get(connection);

  // Creating a session auto-registers the model under the vendor
  await pApi.functional.autobe.playground.sessions.create(connection, {
    vendor_id: vendor.id,
    model: "openai/gpt-4.1",
    locale: "en-US",
    timezone: "Asia/Seoul",
    title: "Model Index Test",
  });

  const models: IAutoBePlaygroundVendorModel[] =
    await pApi.functional.autobe.playground.vendors.models.index(
      connection,
      vendor.id,
    );
  TestValidator.predicate("has data", () => models.length > 0);
  TestValidator.predicate("contains model", () =>
    models.some((m) => m.model === "openai/gpt-4.1"),
  );
};
