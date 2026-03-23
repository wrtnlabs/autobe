import { IAutoBePlaygroundVendor } from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { RandomGenerator, TestValidator } from "@nestia/e2e";

export const test_api_playground_vendor_update = async (
  connection: pApi.IConnection,
): Promise<void> => {
  const vendor: IAutoBePlaygroundVendor =
    await pApi.functional.autobe.playground.vendors.create(connection, {
      name: RandomGenerator.name(),
      apiKey: RandomGenerator.alphaNumeric(32),
      baseURL: "http://localhost:1234",
      semaphore: 16,
    });

  await pApi.functional.autobe.playground.vendors.update(
    connection,
    vendor.id,
    {
      name: "Updated Vendor Name",
      semaphore: 8,
    },
  );

  const read: IAutoBePlaygroundVendor =
    await pApi.functional.autobe.playground.vendors.at(connection, vendor.id);
  TestValidator.equals("name", read.name, "Updated Vendor Name");
  TestValidator.equals("semaphore", read.semaphore, 8);
};
