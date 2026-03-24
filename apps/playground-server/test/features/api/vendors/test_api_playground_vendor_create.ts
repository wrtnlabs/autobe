import { IAutoBePlaygroundVendor } from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { RandomGenerator, TestValidator } from "@nestia/e2e";

export const test_api_playground_vendor_create = async (
  connection: pApi.IConnection,
): Promise<void> => {
  const name = RandomGenerator.name();
  const vendor: IAutoBePlaygroundVendor =
    await pApi.functional.autobe.playground.vendors.create(connection, {
      name,
      apiKey: RandomGenerator.alphaNumeric(32),
      baseURL: "http://localhost:1234",
      semaphore: 16,
    });

  TestValidator.predicate("id exists", () => vendor.id.length > 0);
  TestValidator.equals("name", vendor.name, name);
  TestValidator.equals("semaphore", vendor.semaphore, 16);

  const read: IAutoBePlaygroundVendor =
    await pApi.functional.autobe.playground.vendors.at(connection, vendor.id);
  TestValidator.equals("read.id", read.id, vendor.id);
  TestValidator.equals("read.name", read.name, name);
};
