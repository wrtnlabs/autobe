import { IAutoBePlaygroundVendor } from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { RandomGenerator } from "@nestia/e2e";
import { Singleton } from "tstl";

export namespace TestVendor {
  export const get = (
    connection: pApi.IConnection,
  ): Promise<IAutoBePlaygroundVendor> => vendor.get(connection);
}

const vendor = new Singleton((connection: pApi.IConnection) =>
  pApi.functional.autobe.playground.vendors.create(connection, {
    name: RandomGenerator.name(),
    apiKey: RandomGenerator.alphaNumeric(32),
    baseURL: "http://localhost:1234",
    semaphore: 16,
  }),
);
