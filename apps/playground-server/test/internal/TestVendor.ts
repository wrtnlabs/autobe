import { IAutoBePlaygroundVendor } from "@autobe/interface";
import pApi from "@autobe/playground-api";

export namespace TestVendor {
  let vendor: IAutoBePlaygroundVendor | null = null;

  export const get = async (
    connection: pApi.IConnection,
  ): Promise<IAutoBePlaygroundVendor> => {
    if (vendor !== null) return vendor;
    vendor = await pApi.functional.autobe.playground.vendors.create(
      connection,
      {
        name: "Test Vendor",
        apiKey: "test-dummy-key",
        baseURL: "http://localhost:1234",
        semaphore: 16,
      },
    );
    return vendor;
  };
}
