import { IAutoBePlaygroundVendor, IPage } from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { RandomGenerator, TestValidator } from "@nestia/e2e";

export const test_api_playground_vendor_index = async (
  connection: pApi.IConnection,
): Promise<void> => {
  const vendor: IAutoBePlaygroundVendor =
    await pApi.functional.autobe.playground.vendors.create(connection, {
      name: RandomGenerator.name(),
      apiKey: RandomGenerator.alphaNumeric(32),
      baseURL: "http://localhost:1234",
      semaphore: 16,
    });

  const page: IPage<IAutoBePlaygroundVendor> =
    await pApi.functional.autobe.playground.vendors.index(connection, {
      limit: 100,
      page: 1,
    });
  TestValidator.predicate("has data", () => page.data.length > 0);
  TestValidator.predicate("contains created vendor", () =>
    page.data.some((v) => v.id === vendor.id),
  );
};
