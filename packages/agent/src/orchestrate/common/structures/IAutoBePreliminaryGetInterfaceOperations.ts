import { AutoBeOpenApi } from "@autobe/interface";
import { tags } from "typia";

/** Request to retrieve existing interface operations for context. */
export interface IAutoBePreliminaryGetInterfaceOperations {
  /** Type discriminator. */
  type: "getInterfaceOperations";

  /**
   * API operation endpoints to retrieve. DO NOT request same endpoints already
   * requested in previous calls.
   */
  endpoints: AutoBeOpenApi.IEndpoint[] & tags.MinItems<1>;
}
