import { AutoBeOpenApi } from "@autobe/interface";
import { tags } from "typia";

/**
 * Request to retrieve existing interface operations for context.
 *
 * This type is used in the preliminary phase to request already-generated API
 * operations for review, validation, or complementary generation tasks.
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryGetInterfaceOperations {
  /**
   * Type discriminator for the request.
   *
   * Determines which action to perform: preliminary data retrieval or actual
   * task execution. Value "getInterfaceOperations" indicates this is a
   * preliminary data request for interface operations.
   */
  type: "getInterfaceOperations";

  /**
   * List of existing API operation endpoints to retrieve.
   *
   * Operations that have been generated in previous phases, containing paths,
   * methods, parameters, and request/response bodies.
   *
   * CRITICAL: DO NOT request the same endpoints that you have already requested
   * in previous calls.
   */
  endpoints: AutoBeOpenApi.IEndpoint[] & tags.MinItems<1>;
}
