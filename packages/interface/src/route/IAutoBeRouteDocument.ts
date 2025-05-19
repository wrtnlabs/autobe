import { OpenApi } from "@samchon/openapi";
import { tags } from "typia";

import { IAutoBeRouteOperation } from "./IAutoBeRouteOperation";

/**
 * Document of the Restful API operations.
 *
 * This interface serves as the root document for defining Restful API
 * {@link operations} and {@link components}. It corresponds to the top-level
 * structure of an OpenAPI specification document, containing all API operations
 * and reusable components.
 *
 * This simplified version focuses only on the operations and components,
 * omitting other OpenAPI elements like info, servers, security schemes, etc.
 * to keep the structure concise for AI-based code generation.
 *
 * ## Type Naming Conventions
 *
 * When defining component schemas, follow these naming conventions for consistency:
 *
 * - **Main Entity Types**: Use `IEntityName` format for main entity with detailed information (e.g., `IShoppingSale`)
 * - **Related Operation Types**: Use `IEntityName.IOperation` format with these common suffixes:
 *   - `IEntityName.ICreate`: Request body for creation operations (POST)
 *   - `IEntityName.IUpdate`: Request body for update operations (PUT)
 *   - `IEntityName.ISummary`: Simplified response version with essential properties
 *   - `IEntityName.IRequest`: Request parameters for list operations (often with search/pagination)
 *   - `IEntityName.IInvert`: Alternative view of an entity from a different perspective
 *   - `IPageIEntityName`: Paginated results container with `pagination` and `data` properties
 *
 * These consistent naming patterns help create a predictable and self-documenting API,
 * making it easier for developers to understand the purpose of each schema.
 *
 * @author Samchon
 */
export interface IAutoBeRouteDocument {
  /**
   * List of API operations.
   *
   * This array contains all the API endpoints with their HTTP methods,
   * descriptions, parameters, request/response structures, etc.
   * Each operation corresponds to an entry in the paths section of
   * an OpenAPI document.
   *
   * Note that, combination of {@link IAutoBeRouteOperation.path}
   * and {@link IAutoBeRouteOperation.method} must be unique.
   *
   * Also, never forget any specification that list listed on the
   * requirement analysis report and DB design documents. Every
   * features must be implemented in the API operations.
   */
  operations: IAutoBeRouteOperation[] & tags.MinItems<1>;

  /**
   * Reusable components of the API operations.
   *
   * This contains schemas, parameters, responses, and other reusable
   * elements referenced throughout the API operations. It corresponds
   * to the components section in an OpenAPI document.
   *
   * All request and response bodies must reference named types defined
   * in this components section. This ensures consistency and reusability
   * across the API.
   *
   * When defining components and their nested properties, please fill
   * {@link OpenApi.IJsonSchema.description} properties as much and detail
   * as possible. The descriptions must be enough detailed and conceptually
   * clear that anyone who reads the document can understand the purpose
   * and usage of each type and property.
   *
   * ## Type Naming Conventions in Components
   *
   * When defining schema components, follow these standardized naming patterns
   * for consistency and clarity:
   *
   * ### Main Entity Types
   * - `IEntityName`
   *   - Primary entity objects (e.g., `IShoppingSale`, `IShoppingOrder`)
   *   - These represent the full, detailed version of domain entities
   *
   * ### Operation-Specific Types
   * - `IEntityName.ICreate`
   *   - Request body schemas for creation operations (POST)
   *   - Contains all fields needed to create a new entity
   * - `IEntityName.IUpdate`
   *   - Request body schemas for update operations (PUT)
   *   - Contains fields that can be modified on an existing entity
   * - `IEntityName.IRequest`
   *   - Parameters for search/filter/pagination in list operations
   *   - Often contains `search`, `sort`, `page`, and `limit` properties
   *
   * ### View Types
   * - `IEntityName.ISummary`
   *   - Simplified view of entities for list operations
   *   - Contains essential properties only, omitting detailed nested objects
   * - `IEntityName.IAbridge`: Intermediate view with more details than Summary but less than full entity
   * - `IEntityName.IInvert`: Alternative representation of an entity from a different perspective
   *
   * ### Container Types
   * - `IPageIEntityName`
   *   - Paginated results container
   *   - Usually contains `pagination` and `data` properties
   *
   * These naming conventions create a self-documenting API where the purpose
   * of each schema is immediately clear from its name. This helps both developers
   * and AI tools understand and maintain the API structure.
   */
  components: OpenApi.IComponents;
}
