import { IAutoBePlaygroundVendor, IPage } from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { TestValidator } from "@nestia/e2e";

export const test_api_playground_vendor_erase = async (
  connection: pApi.IConnection,
): Promise<void> => {
  const vendor: IAutoBePlaygroundVendor =
    await pApi.functional.autobe.playground.vendors.create(connection, {
      name: "Erase Target",
      apiKey: "test-dummy-key",
      baseURL: "http://localhost:1234",
      semaphore: 16,
    });

  await pApi.functional.autobe.playground.vendors.erase(connection, vendor.id);

  await TestValidator.error("erased vendor not found", () =>
    pApi.functional.autobe.playground.vendors.at(connection, vendor.id),
  );

  const page: IPage<IAutoBePlaygroundVendor> =
    await pApi.functional.autobe.playground.vendors.index(connection, {
      limit: 100,
      page: 1,
    });
  TestValidator.predicate("not in list", () =>
    page.data.every((v) => v.id !== vendor.id),
  );
};
