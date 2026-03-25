import { tags } from "typia";

/** Request to retrieve OpenAPI schema type definitions for context. */
export interface IAutoBePreliminaryGetInterfaceSchemas {
  /** Type discriminator. */
  type: "getInterfaceSchemas";

  /**
   * Schema type names to retrieve. DO NOT request same names already requested
   * in previous calls.
   */
  typeNames: string[] & tags.MinItems<1>;
}
