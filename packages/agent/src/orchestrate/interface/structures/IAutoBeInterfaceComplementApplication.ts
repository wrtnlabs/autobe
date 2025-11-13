import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

export interface IAutoBeInterfaceComplementApplication {
  /**
   * Process schema complement task or preliminary data requests.
   *
   * Adds missing schema definitions to ensure OpenAPI document is complete and
   * all referenced schemas are properly defined.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeInterfaceComplementApplication.IProps): void;
}

export namespace IAutoBeInterfaceComplementApplication {
  export interface IProps {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getAnalysisFiles, getPrismaSchemas, getInterfaceOperations,
     * getInterfaceSchemas) or final schema complementation (complete). When
     * preliminary returns empty array, that type is removed from the union,
     * physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPrismaSchemas
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas;
  }

  /**
   * Request to add missing schema definitions.
   *
   * Executes schema complementation to fill in referenced but undefined schema
   * types in the OpenAPI document's components.schemas section. Ensures all
   * $ref references resolve to valid schema definitions.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval or actual
     * task execution. Value "complete" indicates this is the final task
     * execution request.
     */
    type: "complete";

    /**
     * A collection of missing schema definitions that need to be added to the
     * OpenAPI document's `components.schemas` section.
     *
     * This object contains schema definitions for types that are referenced but
     * not yet defined:
     *
     * - Key: Schema name (`string`): The name of the schema type that will be
     *   referenced in $ref statements
     * - Value: `AutoBeOpenApi.IJsonSchema` - The complete JSON Schema definition
     *   for that type
     *
     * Example structure:
     *
     * ```typescript
     * {
     *   "UserProfile": {
     *     "type": "object",
     *     "properties": {
     *       "id": { "type": "string" },
     *       "name": { "type": "string" },
     *       "email": { "type": "string", "format": "email" }
     *     },
     *     "required": ["id", "name", "email"]
     *   }
     * }
     * ```
     *
     * Each schema definition follows the JSON Schema specification and will be
     * directly inserted into the OpenAPI document's components.schemas section,
     * making them available for $ref references throughout the API
     * specification.
     */
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  }
}
