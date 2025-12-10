import { tags } from "typia";

/**
 * Request to retrieve OpenAPI schema type definitions for context.
 *
 * This type is used in the preliminary phase to request specific schema
 * definitions from components.schemas for review or complementary generation.
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryGetInterfaceSchemas {
  /**
   * Type discriminator for the request.
   *
   * Determines which action to perform: preliminary data retrieval or actual
   * task execution. Value "getInterfaceSchemas" indicates this is a preliminary
   * data request for interface schemas.
   */
  type: "getInterfaceSchemas";

  /**
   * List of schema type names to retrieve.
   *
   * Schema names from the OpenAPI components.schemas section (e.g., "IUser",
   * "IUser.ICreate", "IPost.IUpdate").
   *
   * CRITICAL: DO NOT request the same type names that you have already
   * requested in previous calls.
   */
  typeNames: string[] & tags.MinItems<1>;
}
